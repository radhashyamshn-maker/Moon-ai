import { AudioStreamer } from './AudioStreamer';
import { LiveState, ToolExecutionEvent } from '../types';

export interface LiveSessionCallbacks {
  onStateChange: (state: LiveState) => void;
  onToolExecuted: (event: ToolExecutionEvent) => void;
  onError: (error: string) => void;
  onDialogueUpdate?: (dialogue: string) => void;
  onThemeChange?: (themeId: string) => void;
  onScreenAnalyzeRequested?: () => void;
  onMediaAction?: (action: string, trackName?: string, volume?: number) => void;
  onHardwareAction?: (feature: string, state: string, value?: number) => void;
  onWhatsAppAction?: (contactName: string, phone: string, message: string) => void;
  onCallAction?: (action: string, contactName?: string, rejectionSms?: string) => void;
  onCalendarAction?: (action: string, title?: string, time?: string) => void;
  onContactsAction?: (action: string, name?: string) => void;
  onSmsAction?: (recipient: string, message: string) => void;
  onAppLaunch?: (appName: string) => void;
  onAlarmAction?: (action: string, time?: string, label?: string) => void;
  onNotificationAction?: (action: string, replyText?: string) => void;
  onPermissionCheck?: (permissionKey: string) => boolean;
  onPermissionRequested?: (permissionKey: string) => void;
  onCloseSession?: (farewellMessage?: string) => void;
  onVideoEditorAction?: (options: { command?: string; mood?: string; aspectRatio?: string; clipDuration?: number; musicTrack?: string; deletePhotosAfterExport?: boolean }) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private audioStreamer: AudioStreamer;
  private state: LiveState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private selectedVoice: string = 'Aoede';
  private isConnecting: boolean = false;
  private speechRecognition: any = null;
  private mockFallbackActive: boolean = false;
  private ttsQueue: string[] = [];
  private isProcessingTtsQueue: boolean = false;
  private lastSpokenText: string = '';

  constructor(audioStreamer: AudioStreamer, callbacks: LiveSessionCallbacks) {
    this.audioStreamer = audioStreamer;
    this.callbacks = callbacks;

    // Connect AudioStreamer playback state with session state
    this.audioStreamer.setPlaybackStateCallback((isPlaying) => {
      if (isPlaying) {
        this.setState('speaking');
      } else if (this.state === 'speaking') {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.setState('listening');
        } else {
          this.setState('disconnected');
        }
      }
    });

    // Handle user intentional barge-in during AI speech
    this.audioStreamer.setBargeInCallback(() => {
      if (this.state === 'speaking') {
        this.setState('listening');
      }
    });
  }

  public getState(): LiveState {
    return this.state;
  }

  public setVoice(voice: string) {
    this.selectedVoice = voice;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'start', voice }));
    }
  }

  private setState(newState: LiveState) {
    if (this.state === newState) return;
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  /**
   * Connects to the Gemini Live Audio-to-Audio WebSocket session
   */
  public async connect(): Promise<void> {
    if (this.state !== 'disconnected' || this.isConnecting) return;

    this.isConnecting = true;
    this.setState('connecting');

    let micAllowed = true;
    try {
      // 1. Initialize microphone streaming if allowed
      await this.audioStreamer.startMicrophoneCapture((base64Chunk) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.state !== 'disconnected') {
          this.ws.send(
            JSON.stringify({
              type: 'audio',
              data: base64Chunk,
            })
          );
        }
      });
    } catch (micErr: any) {
      micAllowed = false;
      console.warn('[LiveSession] Microphone access unavailable or blocked:', micErr?.message);
      if (this.callbacks.onDialogueUpdate) {
        this.callbacks.onDialogueUpdate(
          'Microphone is muted/blocked. You can chat with me by typing in the box below! ✨'
        );
      }
    }

    try {
      // 2. Open WebSocket connection to Express server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[LiveSession] WebSocket connection established');
        this.isConnecting = false;

        // Request starting Gemini Live Audio session
        this.ws?.send(
          JSON.stringify({
            type: 'start',
            voice: this.selectedVoice,
          })
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'connected') {
            console.log('[LiveSession] Gemini Live Session is live!');
            this.setState('listening');
            this.audioStreamer.playChime('connect');
          } else if (msg.type === 'audio') {
            // Incoming 24kHz PCM audio chunk from Gemini Live
            this.audioStreamer.queueAudioChunk(msg.data);
          } else if (msg.type === 'dialogue') {
            if (this.callbacks.onDialogueUpdate && msg.text) {
              this.callbacks.onDialogueUpdate(msg.text);
            }
          } else if (msg.type === 'turnComplete') {
            // Server completed sending audio chunks for the turn
            this.audioStreamer.endTurn();
          } else if (msg.type === 'interrupted') {
            // User spoke while model was speaking
            console.log('[LiveSession] Interruption triggered');
            this.audioStreamer.stopPlayback();
            this.clearTtsQueue();
            this.setState('listening');
          } else if (msg.type === 'toolCall') {
            // Model wants to call browser/system function
            this.handleToolCalls(msg.toolCall);
          } else if (msg.type === 'warning') {
            console.warn('[LiveSession] Server notice:', msg.message);
            this.enableLocalSassyFallback();
          } else if (msg.type === 'error') {
            console.error('[LiveSession] Live error:', msg.message);
            this.callbacks.onError(msg.message);
            this.enableLocalSassyFallback();
          } else if (msg.type === 'sessionClosed' || msg.type === 'disconnected') {
            this.disconnect();
          }
        } catch (err) {
          console.error('[LiveSession] Failed to process message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[LiveSession] WebSocket connecting note, switching to resilient assistant mode');
        this.enableLocalSassyFallback();
      };

      this.ws.onclose = () => {
        console.log('[LiveSession] WebSocket closed');
        if (this.state !== 'disconnected') {
          this.disconnect();
        }
      };
    } catch (err: any) {
      console.warn('[LiveSession] WebSocket connection notice, switching to fallback:', err);
      this.isConnecting = false;
      this.enableLocalSassyFallback();
    }
  }

  /**
   * Sends real-time video/screen frame to Gemini Live
   */
  public sendVideoFrame(cleanBase64: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.state !== 'disconnected') {
      this.ws.send(
        JSON.stringify({
          type: 'videoFrame',
          data: cleanBase64,
        })
      );
    }
  }

  /**
   * Executes tools called by the Gemini Live session and returns toolResponses
   */
  private async handleToolCalls(toolCallPayload: any) {
    this.setState('processing');
    this.audioStreamer.playChime('tool');

    const functionCalls = toolCallPayload?.functionCalls || [];
    const responses: any[] = [];

    for (const call of functionCalls) {
      const { id, name, args } = call;
      console.log(`[LiveSession] Executing tool: ${name}`, args);

      let resultText = '';
      let eventType: ToolExecutionEvent['type'] = 'action';

      try {
        // Permission enforcement helper
        const requirePermission = (permKey: string, permTitle: string): boolean => {
          if (this.callbacks.onPermissionCheck && !this.callbacks.onPermissionCheck(permKey)) {
            if (this.callbacks.onPermissionRequested) {
              this.callbacks.onPermissionRequested(permKey);
            }
            resultText = `Permission restricted: Tung Tung requires '${permTitle}' authorization. Permission request prompt opened.`;
            return false;
          }
          return true;
        };

        if (name === 'analyzeScreen') {
          eventType = 'vision';
          if (requirePermission('camera_screen', 'Camera & Screen Vision')) {
            if (this.callbacks.onScreenAnalyzeRequested) {
              this.callbacks.onScreenAnalyzeRequested();
            }
            resultText = `Screen vision sensor activated and analyzed user workspace`;
          }
        } else if (name === 'controlMedia') {
          eventType = 'media';
          const action = args?.action || 'toggle';
          const trackName = args?.trackName || 'Lo-Fi Beats';
          const volume = args?.volume;
          if (this.callbacks.onMediaAction) {
            this.callbacks.onMediaAction(action, trackName, volume);
          }
          resultText = `Media ${action} executed (${trackName || 'active track'})`;
        } else if (name === 'manageHardware') {
          eventType = 'hardware';
          if (requirePermission('device_settings', 'System Hardware Settings')) {
            const feature = args?.feature || 'flashlight';
            const state = args?.state || 'toggle';
            const value = args?.value;
            if (this.callbacks.onHardwareAction) {
              this.callbacks.onHardwareAction(feature, state, value);
            }
            resultText = `Hardware ${feature} updated to ${state}${value !== undefined ? ` (${value}%)` : ''}`;
          }
        } else if (name === 'managePhonePermissions') {
          eventType = 'action';
          const permission = args?.permission || 'microphone';
          const action = args?.action || 'check';
          if (this.callbacks.onPermissionRequested) {
            this.callbacks.onPermissionRequested(permission);
          }
          resultText = `Phone permission ${permission} status: processed action '${action}'`;
        } else if (name === 'sendSms') {
          eventType = 'action';
          if (requirePermission('sms_messaging', 'SMS & Direct Messaging')) {
            const recipient = args?.recipient || 'Contact';
            const message = args?.message || '';
            if (this.callbacks.onSmsAction) {
              this.callbacks.onSmsAction(recipient, message);
            }
            resultText = `SMS sent to ${recipient}: "${message}"`;
          }
        } else if (name === 'launchApp') {
          eventType = 'action';
          if (requirePermission('accessibility', 'UI Accessibility & App Automation')) {
            const appName = args?.appName || 'App';
            if (this.callbacks.onAppLaunch) {
              this.callbacks.onAppLaunch(appName);
            }
            resultText = `Launched ${appName} successfully`;
          }
        } else if (name === 'manageAlarm') {
          eventType = 'action';
          if (requirePermission('device_settings', 'Clock & Alarm Controls')) {
            const action = args?.action || 'set_alarm';
            const time = args?.time || '07:30 AM';
            const label = args?.label || 'Reminder';
            if (this.callbacks.onAlarmAction) {
              this.callbacks.onAlarmAction(action, time, label);
            }
            resultText = `Alarm ${action}: ${time} (${label})`;
          }
        } else if (name === 'manageNotifications') {
          eventType = 'notification';
          if (requirePermission('notifications', 'Notification Interception Service')) {
            const action = args?.action || 'read_all';
            const replyText = args?.replyText;
            if (this.callbacks.onNotificationAction) {
              this.callbacks.onNotificationAction(action, replyText);
            }
            resultText = `Notification service: ${action}`;
          }
        } else if (name === 'sendWhatsApp') {
          eventType = 'whatsapp';
          if (requirePermission('sms_messaging', 'Messaging & WhatsApp')) {
            const contactName = args?.contactName || 'Friend';
            const phone = args?.phone || '';
            const message = args?.message || '';
            if (this.callbacks.onWhatsAppAction) {
              this.callbacks.onWhatsAppAction(contactName, phone, message);
            }
            // Direct launch to WhatsApp Web / app
            const waUrl = phone
              ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
              : `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');
            resultText = `WhatsApp message prepared for ${contactName}: "${message}"`;
          }
        } else if (name === 'manageCalls') {
          eventType = 'call';
          if (requirePermission('phone_calls', 'Phone Calls & Screening')) {
            const action = args?.action || 'screen_call';
            const contactName = args?.contactName || 'Caller';
            const rejectionSms = args?.rejectionSms;
            if (this.callbacks.onCallAction) {
              this.callbacks.onCallAction(action, contactName, rejectionSms);
            }
            resultText = `Handled call action: ${action} for ${contactName}`;
          }
        } else if (name === 'manageCalendar') {
          eventType = 'calendar';
          const action = args?.action || 'add_event';
          const title = args?.title || 'Meeting';
          const time = args?.time || 'Today';
          if (this.callbacks.onCalendarAction) {
            this.callbacks.onCalendarAction(action, title, time);
          }
          resultText = `Calendar: ${action} "${title}" for ${time}`;
        } else if (name === 'manageContacts') {
          eventType = 'action';
          if (requirePermission('contacts', 'Contacts Directory')) {
            const action = args?.action || 'view';
            const contactName = args?.name || '';
            if (this.callbacks.onContactsAction) {
              this.callbacks.onContactsAction(action, contactName);
            }
            resultText = `Contacts: ${action} ${contactName}`;
          }
        } else if (name === 'openWebsite') {
          eventType = 'website';
          let url = args?.url || '';
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
          }
          const siteName = args?.siteName || url;
          window.open(url, '_blank', 'noopener,noreferrer');
          resultText = `Opened ${siteName} in a new tab`;
        } else if (name === 'searchWeb') {
          eventType = 'search';
          const query = args?.query || '';
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          window.open(searchUrl, '_blank', 'noopener,noreferrer');
          resultText = `Searched Google for "${query}"`;
        } else if (name === 'changeAtmosphereTheme') {
          eventType = 'theme';
          const theme = args?.theme || 'electric-violet';
          if (this.callbacks.onThemeChange) {
            this.callbacks.onThemeChange(theme);
          }
          resultText = `Atmospheric aura shifted to ${theme}`;
        } else if (name === 'createCinematicVideo') {
          eventType = 'action';
          if (this.callbacks.onVideoEditorAction) {
            this.callbacks.onVideoEditorAction(args || {});
          }
          resultText = `Jarvis Video Studio active: Configured ${args?.mood || 'Cinematic'} style, ${args?.aspectRatio || '9:16'} aspect ratio.`;
        } else if (name === 'closeSession') {
          eventType = 'action';
          const farewell = args?.farewellMessage || 'Hai hai! Main so rahi hoon... Oyasuminasai! 💤✨';
          if (this.callbacks.onCloseSession) {
            this.callbacks.onCloseSession(farewell);
          }
          resultText = `Moon is going to sleep / Session closed: "${farewell}"`;
        } else {
          resultText = `Executed ${name} with parameters`;
        }

        // Record execution event for UI HUD toast
        this.callbacks.onToolExecuted({
          id: id || `${Date.now()}`,
          name,
          args: args || {},
          result: resultText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: eventType,
        });

        responses.push({
          id,
          name,
          response: {
            output: resultText,
            status: 'success',
          },
        });
      } catch (err: any) {
        console.error(`[LiveSession] Error executing tool ${name}:`, err);
        responses.push({
          id,
          name,
          response: {
            error: err?.message || 'Tool execution failed',
            status: 'error',
          },
        });
      }
    }

    // Send function responses back to Gemini Live
    if (this.ws && this.ws.readyState === WebSocket.OPEN && responses.length > 0) {
      this.ws.send(
        JSON.stringify({
          type: 'toolResponse',
          responses,
        })
      );
    }
  }

  /**
   * Graceful fallback sassy companion voice engine in case API key is unpopulated in preview
   */
  private enableLocalSassyFallback() {
    if (this.mockFallbackActive) return;
    this.mockFallbackActive = true;
    this.setState('listening');
    console.log('[LiveSession] Sassy Voice Assistant interactive fallback online.');

    // Speech recognition setup for fallback mode
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.lang = 'en-US';

        this.speechRecognition.onresult = (event: any) => {
          // If Tung Tung is actively speaking, ignore mic audio so she doesn't respond to herself
          if (this.state === 'speaking' || this.isProcessingTtsQueue || (window.speechSynthesis && window.speechSynthesis.speaking)) {
            return;
          }

          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          if (!transcript) return;

          console.log('[FallbackVoice] User said:', transcript);
          this.setState('thinking');
          this.handleFallbackUserSpeech(transcript);
        };

        this.speechRecognition.onerror = (e: any) => {
          console.warn('[FallbackVoice] Speech recognition notice:', e.error);
        };

        this.speechRecognition.start();
      } catch (e) {}
    }
  }

  private handleFallbackUserSpeech(text: string) {
    const lower = text.toLowerCase();
    let reply = '';
    let toolTriggered: ToolExecutionEvent | null = null;

    if (
      lower.includes('so jao') ||
      lower.includes('band ho jao') ||
      lower.includes('so ja') ||
      lower.includes('band hoja') ||
      lower.includes('sleep') ||
      lower.includes('good night') ||
      lower.includes('goodnight') ||
      lower.includes('bye bye') ||
      lower.includes('shubh ratri') ||
      lower.includes('alvida') ||
      lower.includes('chup ho jao') ||
      lower.includes('disconnect') ||
      lower.includes('close session') ||
      lower.includes('rest now')
    ) {
      reply = "Hai hai! Main so rahi hoon... Oyasuminasai! Shubh ratri! 💤✨";
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'closeSession',
        args: { farewellMessage: reply, reason: 'voice_command' },
        result: 'Auto-Closure: Voice command triggered sleep mode',
        timestamp: new Date().toLocaleTimeString(),
        type: 'action',
      };
      if (this.callbacks.onCloseSession) {
        this.callbacks.onCloseSession(reply);
      }
    } else if (lower.includes('look at') || lower.includes('screen') || lower.includes('see')) {
      if (this.callbacks.onScreenAnalyzeRequested) {
        this.callbacks.onScreenAnalyzeRequested();
      }
      reply = "E-eto... scanning your screen right away! I'll take a close look for you! ✨";
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'analyzeScreen',
        args: {},
        result: 'Screen vision sensor activated',
        timestamp: new Date().toLocaleTimeString(),
        type: 'vision',
      };
    } else if (lower.includes('music') || lower.includes('play') || lower.includes('song') || lower.includes('lofi') || lower.includes('beat')) {
      if (this.callbacks.onMediaAction) {
        this.callbacks.onMediaAction('play', 'Lo-Fi Anime Chill');
      }
      reply = "Playing some cozy anime and lo-fi melodies for you! Please enjoy! 🌸";
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'controlMedia',
        args: { action: 'play' },
        result: 'Music playback started',
        timestamp: new Date().toLocaleTimeString(),
        type: 'media',
      };
    } else if (lower.includes('pause') || lower.includes('stop music')) {
      if (this.callbacks.onMediaAction) {
        this.callbacks.onMediaAction('pause');
      }
      reply = "Music is paused now! I'm listening closely to you! ✨";
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'controlMedia',
        args: { action: 'pause' },
        result: 'Music playback paused',
        timestamp: new Date().toLocaleTimeString(),
        type: 'media',
      };
    } else if (lower.includes('torch') || lower.includes('flashlight')) {
      if (this.callbacks.onHardwareAction) {
        this.callbacks.onHardwareAction('flashlight', 'toggle');
      }
      reply = "Flashlight toggled on! Is it bright enough, user-san?";
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'manageHardware',
        args: { feature: 'flashlight', state: 'toggle' },
        result: 'Flashlight beam toggled',
        timestamp: new Date().toLocaleTimeString(),
        type: 'hardware',
      };
    } else if (lower.includes('whatsapp') || lower.includes('message')) {
      const msg = "Hey! Moon sent this for me ✨";
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      reply = "Drafted and opened WhatsApp for you! 💬";
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'sendWhatsApp',
        args: { message: msg },
        result: 'WhatsApp opened with message',
        timestamp: new Date().toLocaleTimeString(),
        type: 'whatsapp',
      };
    } else if (lower.includes('youtube')) {
      window.open('https://youtube.com', '_blank');
      reply = "Opening YouTube for you! Hope you find awesome videos to watch! 📺";
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'openWebsite',
        args: { url: 'https://youtube.com', siteName: 'YouTube' },
        result: 'Opened YouTube in new tab',
        timestamp: new Date().toLocaleTimeString(),
        type: 'website',
      };
    } else if (lower.includes('spotify')) {
      window.open('https://open.spotify.com', '_blank');
      reply = "Spotify opened! I love listening to sweet music with you! 🎧";
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'openWebsite',
        args: { url: 'https://open.spotify.com', siteName: 'Spotify' },
        result: 'Opened Spotify',
        timestamp: new Date().toLocaleTimeString(),
        type: 'website',
      };
    } else if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('event')) {
      if (this.callbacks.onCalendarAction) {
        this.callbacks.onCalendarAction('list_events');
      }
      reply = "Pulled up your calendar! Let's organize everything together! 📅";
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'manageCalendar',
        args: { action: 'list_events' },
        result: 'Calendar schedule opened',
        timestamp: new Date().toLocaleTimeString(),
        type: 'calendar',
      };
    } else if (lower.includes('theme') || lower.includes('color') || lower.includes('pink') || lower.includes('rose') || lower.includes('matrix')) {
      const themeId = lower.includes('rose') || lower.includes('pink') 
        ? 'neon-rose' 
        : lower.includes('matrix') || lower.includes('green') 
        ? 'emerald-matrix' 
        : lower.includes('cyan') || lower.includes('blue') 
        ? 'cyber-cyan' 
        : 'electric-violet';
      if (this.callbacks.onThemeChange) {
        this.callbacks.onThemeChange(themeId);
      }
      reply = `Waah, this atmosphere looks so pretty! Shifted the theme to ${themeId}! ✨`;
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'changeAtmosphereTheme',
        args: { theme: themeId },
        result: `Switched theme to ${themeId}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'theme',
      };
    } else if (lower.includes('search') || lower.includes('who is') || lower.includes('what is') || lower.includes('google')) {
      const q = text.replace(/search for|search|google|who is|what is/gi, '').trim() || text;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
      reply = `Searching Google for "${q}" right now!`;
      toolTriggered = {
        id: `${Date.now()}`,
        name: 'searchWeb',
        args: { query: q },
        result: `Searched Google for "${q}"`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'search',
      };
    } else if (lower.includes('sweet') || lower.includes('cute') || lower.includes('compliment') || lower.includes('love') || lower.includes('marry')) {
      const shyReplies = [
        "Kyaa~! (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄) You're making my face all red... but thank you!",
        "E-eto... hearing that from you makes me so happy! I'll always cheer for you! 💖",
        "Uwaa~ you are always so kind to me, user-san! (* ^ ω ^)",
      ];
      reply = shyReplies[Math.floor(Math.random() * shyReplies.length)];
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('konnichiwa')) {
      const sweetHellos = [
        "Konnichiwa, user-san! Moon is here and ready to help you with anything! 🌸",
        "Hello there! I'm so happy to chat with you today! ✨",
        "Hi! (｡♥‿♥｡) How are you feeling today?",
      ];
      reply = sweetHellos[Math.floor(Math.random() * sweetHellos.length)];
    } else {
      const animeReplies = [
        "Hai! I understand completely! Let's do our best together! ✨",
        "E-eto... I'm listening closely! Please tell me more! 🌸",
        "Hai hai! Moon is right here by your side!",
        "That sounds wonderful! I'll do whatever I can to assist you! 💖",
      ];
      reply = animeReplies[Math.floor(Math.random() * animeReplies.length)];
    }

    if (toolTriggered) {
      this.callbacks.onToolExecuted(toolTriggered);
    }

    this.speakSassyText(reply);
  }

  /**
   * Directly sends a text message to Moon (handling both Live WebSocket and Standalone mode with the EXACT SAME Voice Model)
   */
  public async sendTextMessage(text: string) {
    if (!text || !text.trim()) return;
    const clean = text.trim();

    this.setState('thinking');

    // 1. If WebSocket is connected and active, forward directly through Gemini Live Session
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.state !== 'disconnected') {
      this.ws.send(
        JSON.stringify({
          type: 'text',
          data: clean,
          voice: this.selectedVoice,
        })
      );
      return;
    }

    // 2. High-performance Gemini API backend response using the EXACT SAME voice model (Aoede or selected voice)
    try {
      await this.audioStreamer.initAudioContexts();
      const res = await fetch('/api/chat-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clean,
          voice: this.selectedVoice,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat-turn endpoint returned ${res.status}`);
      }

      const data = await res.json();
      if (data.reply && this.callbacks.onDialogueUpdate) {
        this.callbacks.onDialogueUpdate(data.reply);
      }

      if (data.audio) {
        this.setState('speaking');
        this.audioStreamer.queueAudioChunk(data.audio);
        this.audioStreamer.endTurn();
      } else if (data.reply) {
        this.speakSassyText(data.reply);
      } else {
        this.setState('disconnected');
      }
    } catch (err) {
      console.warn('[LiveSession] Gemini chat-turn fallback:', err);
      this.handleFallbackUserSpeech(clean);
    }
  }

  /**
   * Speaks text using the EXACT SAME Gemini voice model (e.g. Aoede), with browser TTS as offline backup
   */
  public async speakSassyText(text: string) {
    if (!text || typeof text !== 'string') return;
    const cleanText = text.trim();
    if (!cleanText) return;

    if (this.callbacks.onDialogueUpdate) {
      this.callbacks.onDialogueUpdate(cleanText);
    }

    // Prevent duplicate speech calls for identical text
    if (cleanText === this.lastSpokenText && (this.isProcessingTtsQueue || (window.speechSynthesis && window.speechSynthesis.speaking))) {
      return;
    }
    this.lastSpokenText = cleanText;

    // 1. First attempt: High-fidelity Gemini Voice Model synthesis matching the Live Voice (e.g. Aoede, Kore, etc.)
    try {
      await this.audioStreamer.initAudioContexts();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice: this.selectedVoice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          this.setState('speaking');
          this.audioStreamer.queueAudioChunk(data.audio);
          this.audioStreamer.endTurn();
          return;
        }
      }
    } catch (e) {
      console.warn('[LiveSession] Gemini TTS endpoint unreachable, using local speech fallback:', e);
    }

    // 2. Offline failsafe fallback: browser speech synthesis
    if (!('speechSynthesis' in window)) return;

    // Sentence/phrase boundary buffer:
    // Split into complete sentences to ensure clean, natural cadence without mid-phrase interruptions
    const sentences = cleanText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length === 0) {
      sentences.push(cleanText);
    }

    // Append to TTS queue
    this.ttsQueue.push(...sentences);

    // If not already speaking, start processing the queue immediately
    if (!this.isProcessingTtsQueue) {
      this.processTtsQueue();
    }
  }

  /**
   * Processes queued speech sentences sequentially without interrupting active utterances
   */
  private processTtsQueue() {
    if (this.ttsQueue.length === 0) {
      this.isProcessingTtsQueue = false;
      if (this.state === 'speaking') {
        this.setState('listening');
      }
      return;
    }

    this.isProcessingTtsQueue = true;
    this.setState('speaking');

    const nextSentence = this.ttsQueue.shift();
    if (!nextSentence) {
      this.processTtsQueue();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(nextSentence);
      utterance.pitch = 1.15;
      utterance.rate = 1.02;

      // Pick female voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) =>
          v.name.includes('Samantha') ||
          v.name.includes('Victoria') ||
          v.name.includes('Zira') ||
          v.name.includes('Google UK English Female') ||
          v.name.includes('Karen') ||
          (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onend = () => {
        // Small 40ms inter-sentence natural breath pause
        setTimeout(() => {
          this.processTtsQueue();
        }, 40);
      };

      utterance.onerror = (e) => {
        console.warn('[LiveSession] TTS utterance notice:', e);
        this.processTtsQueue();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[LiveSession] TTS error:', err);
      this.processTtsQueue();
    }
  }

  /**
   * Clears any pending TTS items and cancels active speech synthesis on user interruption
   */
  public clearTtsQueue() {
    this.ttsQueue = [];
    this.isProcessingTtsQueue = false;
    this.lastSpokenText = '';
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Disconnects the session and frees all audio contexts and WebSockets
   */
  public disconnect(): void {
    this.isConnecting = false;
    this.mockFallbackActive = false;
    this.clearTtsQueue();

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (e) {}
      this.speechRecognition = null;
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'stop' }));
        this.ws.close();
      }
      this.ws = null;
    }

    this.audioStreamer.stopPlayback();
    this.audioStreamer.stopMicrophoneCapture();
    this.audioStreamer.playChime('disconnect');

    this.setState('disconnected');
  }
}

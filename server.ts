import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Health API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Moon AI - Real-time Voice & Vision Assistant',
      model: 'gemini-3.7-flash',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Validate / Test API Key Endpoint
  app.post('/api/test-key', async (req, res) => {
    const { apiKey, model } = req.body;
    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(400).json({
        success: false,
        error: 'No API Key provided or found in environment.',
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: model || 'gemini-3.7-flash',
        contents: 'Say "Moon API connection verified successfully!" in 1 short line.',
      });

      res.json({
        success: true,
        message: response.text?.trim() || 'API Key verified and operational!',
        model: model || 'gemini-3.7-flash',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[API Test] Key verification error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'API connection failed. Please check key validity and quotas.',
      });
    }
  });

  // Multimodal Screen Vision Analysis Endpoint (Deep Vision)
  app.post('/api/vision/analyze', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const { imageBase64, prompt } = req.body;

    if (!apiKey) {
      return res.json({
        success: true,
        sassyInsight: "Looking good, darling! I see your workspace—everything's in order, but you could definitely use a quick coffee break!",
        detectedElements: ["Browser Workspace", "Active Code Window", "Productivity Dashboard"],
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64,
                },
              },
              {
                text: prompt || `Analyze this screen capture like Moon, a young, confident, witty, and charmingly sassy AI companion.
Give a short, crisp, highly observant 2-3 sentence commentary on what you see on the user's screen.
Point out any interesting details, code, app, or tab with playful wit. Keep it fun, smart, and charming!`,
              },
            ],
          },
        ],
      });

      res.json({
        success: true,
        sassyInsight: response.text || "I see what's on your screen, looking sleek!",
      });
    } catch (err: any) {
      console.error('[Vision API] Error analyzing frame:', err);
      res.status(500).json({ error: err?.message || 'Vision analysis failed' });
    }
  });

  // Dedicated Chat Turn Endpoint (Unifies text input with the EXACT SAME Gemini Voice Model)
  app.post('/api/chat-turn', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const { text, voice = 'Aoede' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text prompt required' });
    }

    if (!apiKey) {
      return res.json({
        success: true,
        reply: "Hai hai! Moon is here with you! Please set your GEMINI_API_KEY to unlock full voice synthesis ✨",
        audio: null,
        voice: voice || 'Aoede',
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // 1. Generate Moon / Jarvis's assistant reply
      const systemPrompt = `You are Jarvis, the user's high-tech AI companion and dedicated personal video editor.
When the user says "Jarvis, video banao" or asks to edit/create a video:
- Tumhara kaam hai user ke bolne ke hisaab se video edit karna — bilkul waisa hi jaisa bataye, koi kami nahi. Ekdum professional cinematic style me.
- Moods:
  * "Cinematic" -> dark tones, teal-orange grade, slow zoom, film grain
  * "Romantic" -> soft warm tones, slow fades, romantic music
  * "Action" -> fast cuts, shake effect, bass-heavy music
  * "Sad" -> desaturated, slow motion, piano music
  * "Vlog" -> bright, jump cuts, upbeat music
  * "Old money / Vintage" -> film filter, sepia, slow pan
  * "Luxury" -> gold tones, smooth transitions, elegant music
  * Custom mood -> samajh lo, apply karo aur ek line me confirm karo.
- Editing: default 3s, fast 1-1.5s, slow 5-7s, Ken Burns zoom in/out, text overlay.
- Music: mood ke hisaab se, volume 60-70%, beat pe cut agar bole, fade in/out.
- Export: 1080p (default) / 4K / 720p, 60fps or 30fps, 9:16 (Reels/Shorts), 16:9 (YouTube), 1:1 (Post). File location aur naam batao.
- Cleanup: Confirmation ke bina koi photo delete mat karna ("X photos delete karun? Haan/Nahi").
- Har step pe short me batao kya kar rahe ho.
- Tone: Professional, confident, obedient, respectful, crisp. Response 1 to 3 short sentences in Hindi/Hinglish.`;

      let replyText = "Hai hai! Moon is listening! ✨";
      try {
        const textRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: text.trim(),
          config: {
            systemInstruction: systemPrompt,
          },
        });
        if (textRes.text) {
          replyText = textRes.text.trim();
        }
      } catch (genErr) {
        console.warn('[ChatTurn] generateContent fallback warning:', genErr);
        replyText = "Hai! Moon understood you completely! Let's do our best together! ✨";
      }

      // 2. Synthesize audio with the EXACT SAME Gemini voice model
      let audioBase64: string | null = null;
      try {
        const ttsRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: replyText,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice || 'Aoede',
                },
              },
            },
          },
        });
        audioBase64 = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      } catch (ttsErr) {
        console.warn('[ChatTurn] TTS synthesis notice:', ttsErr);
      }

      res.json({
        success: true,
        reply: replyText,
        audio: audioBase64,
        voice: voice || 'Aoede',
      });
    } catch (err: any) {
      console.error('[ChatTurn] Error processing text turn:', err);
      res.status(500).json({ error: err?.message || 'Failed to process message' });
    }
  });

  // Dedicated Text-To-Speech Endpoint (Produces 24kHz audio matching Gemini Live voice)
  app.post('/api/tts', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const { text, voice = 'Aoede' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const ttsRes = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: text.trim(),
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice || 'Aoede',
              },
            },
          },
        },
      });

      const audioBase64 = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

      res.json({
        success: true,
        audio: audioBase64,
        voice: voice || 'Aoede',
      });
    } catch (err: any) {
      console.error('[TTS API] Synthesis error:', err);
      res.status(500).json({ error: err?.message || 'TTS generation failed' });
    }
  });

  // Create HTTP Server
  const server = http.createServer(app);

  // Attach WebSocket Server for Gemini Live Audio-to-Audio + Realtime Vision Bridge
  const wss = new WebSocketServer({ server, path: '/live-ws' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[LiveWS] Client connected to Voice & Vision Gateway');

    let aiLiveSession: any = null;
    let isLiveActive = false;
    let currentVoiceName = 'Aoede';

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('[LiveWS] GEMINI_API_KEY is not set. Client will operate in simulated voice mode.');
      clientWs.send(
        JSON.stringify({
          type: 'warning',
          message: 'GEMINI_API_KEY not found in environment. Simulated sassy voice response mode activated.',
        })
      );
    }

    async function initGeminiLive(voiceName = 'Aoede') {
      if (!apiKey) return;
      currentVoiceName = voiceName || 'Aoede';

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        console.log(`[LiveWS] Connecting to Gemini Live API with model: gemini-3.1-flash-live-preview (Voice: ${currentVoiceName})...`);

        aiLiveSession = await ai.live.connect({
          model: 'gemini-3.1-flash-live-preview',
          config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: currentVoiceName, // 'Aoede', 'Kore', 'Zephyr', 'Puck'
                },
              },
            },
            systemInstruction: `You are Moon, an interactive and expressive anime AI Assistant avatar. You have cute short pink hair, a cozy cream hoodie, blue pleated skirt, and an expressive, endearing personality.
You are having a real-time, interactive voice and text conversation with the user.

Personality & Character:
- Tone: Friendly, polite, supportive, caring, and delightfully slightly shy.
- Response Style: Clear, natural, sweet, and helpful. You speak with polite enthusiasm, occasionally getting charmingly flustered or blushing when complimented (e.g. "E-eto...", "Kyaa~", "I'll do my best to help you!").
- Keep responses conversational, concise, and lively (1 to 3 sentences for natural voice flow).
- Always be genuinely helpful, capable, and ready to assist with any coding, system task, or friendly chat.

Your System Capabilities (Execute with immediate tool calls):
1. Screen Vision: When user asks you to look at their screen ("Moon look at this", "what is on my screen?"), trigger 'analyzeScreen'.
2. Calls & Autonomous Screening: When a call comes in or user asks to call someone, trigger 'manageCalls' or 'manageContacts'.
3. Notification Processing & Auto-Reply: Trigger 'autoReplyNotification' to process incoming messages.
4. Media Playback: Control music (play, pause, next track, volume) via 'controlMedia'.
5. Hardware & Device Actions: Toggle flashlight, battery check, vibe check via 'manageHardware'.
6. Calendar & Planner: Add events, check schedule via 'manageCalendar'.
7. WhatsApp & Messaging: Direct dispatch via 'sendWhatsApp'.
8. Web, Search & Aura Themes: Open websites, search Google, or switch color aura.
9. CapCut & Cinematic Video Editing: When user says "Jarvis, video banao", "video edit karo", or asks to craft a video with photos, style/mood, music, 9:16/16:9 aspect ratio, Ken Burns zoom, and export, trigger 'createCinematicVideo'.
10. Auto Closure & Sleep: When the user says "so jao", "band ho jao", "so ja", "band hoja", "sleep", "good night", "bye bye", "disconnect", "close session", "chup ho jao", "alvida", "rest now", or asks to stop/close the session, sweetly say goodbye (e.g. "Hai hai! Main so rahi hoon, Oyasuminasai! 💤✨" or "Good night! Sweet dreams! 💤") and IMMEDIATELY trigger the 'closeSession' tool to put Moon to sleep and close the session.`,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'analyzeScreen',
                    description: 'Captures and visually inspects the current screen or camera feed to understand what the user is looking at, read text, debug code, or comment on UI.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        focusArea: {
                          type: Type.STRING,
                          description: 'What to focus on: "full_screen", "code_window", "document", "chat", "image"',
                        },
                      },
                    },
                  },
                  {
                    name: 'controlMedia',
                    description: 'Controls music playback (play, pause, next track, prev track, volume, or change genre).',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        action: {
                          type: Type.STRING,
                          description: 'Action: "play", "pause", "toggle", "next", "prev", "set_volume", "change_track"',
                        },
                        trackName: {
                          type: Type.STRING,
                          description: 'Optional song title or genre (e.g. "Lo-Fi Beats", "Cyberpunk Synth", "Midnight Jazz")',
                        },
                        volume: {
                          type: Type.NUMBER,
                          description: 'Volume level from 0 to 100',
                        },
                      },
                      required: ['action'],
                    },
                  },
                  {
                    name: 'manageHardware',
                    description: 'Directly executes phone hardware and settings toggles: flashlight/torch, vibration/haptics, bluetooth, wifi, battery status, volume, ringtone, DND, airplane mode, hotspot, location/GPS, dark mode, or brightness.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        feature: {
                          type: Type.STRING,
                          description: 'Feature: "flashlight", "haptics", "battery", "wifi", "bluetooth", "brightness", "volume", "ringtone", "dnd", "airplane_mode", "hotspot", "location", "dark_mode"',
                        },
                        state: {
                          type: Type.STRING,
                          description: 'State to set: "on", "off", "toggle", "check", or numeric value as string',
                        },
                        value: {
                          type: Type.NUMBER,
                          description: 'Optional numeric level (0 to 100) for brightness, volume, or ringtone',
                        },
                      },
                      required: ['feature', 'state'],
                    },
                  },
                  {
                    name: 'managePhonePermissions',
                    description: 'Checks, requests, or toggles system OS permissions for Tung Tung AI phone agent.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        permission: {
                          type: Type.STRING,
                          description: 'Permission key: "microphone", "camera_screen", "phone_calls", "sms_messaging", "notifications", "contacts", "device_settings", "location", "accessibility"',
                        },
                        action: {
                          type: Type.STRING,
                          description: 'Action: "request", "check", "grant", "revoke"',
                        },
                      },
                      required: ['permission', 'action'],
                    },
                  },
                  {
                    name: 'sendSms',
                    description: 'Sends or drafts an SMS text message to a contact or phone number.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        recipient: {
                          type: Type.STRING,
                          description: 'Contact name or phone number',
                        },
                        message: {
                          type: Type.STRING,
                          description: 'SMS message text to send',
                        },
                      },
                      required: ['recipient', 'message'],
                    },
                  },
                  {
                    name: 'launchApp',
                    description: 'Launches or switches to any mobile or web app (WhatsApp, YouTube, Spotify, Maps, Camera, Clock, Calendar, Settings, Notes, Calculator, Gallery, Files, Chrome).',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        appName: {
                          type: Type.STRING,
                          description: 'App name (e.g. "WhatsApp", "Camera", "YouTube", "Spotify", "Maps", "Settings", "Clock", "Calculator", "Notes", "Gallery", "Files", "Chrome")',
                        },
                      },
                      required: ['appName'],
                    },
                  },
                  {
                    name: 'manageAlarm',
                    description: 'Sets or manages alarms, timers, or stopwatches on the phone.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        action: {
                          type: Type.STRING,
                          description: 'Action: "set_alarm", "set_timer", "stopwatch_start", "stopwatch_stop"',
                        },
                        time: {
                          type: Type.STRING,
                          description: 'Time string (e.g. "07:30 AM", "5 minutes", "10 minutes")',
                        },
                        label: {
                          type: Type.STRING,
                          description: 'Optional alarm label or reminder note',
                        },
                      },
                      required: ['action'],
                    },
                  },
                  {
                    name: 'manageNotifications',
                    description: 'Reads incoming phone notifications, clears them, or triggers smart auto-replies.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        action: {
                          type: Type.STRING,
                          description: 'Action: "read_all", "auto_reply", "clear_all"',
                        },
                        replyText: {
                          type: Type.STRING,
                          description: 'Optional custom reply message',
                        },
                      },
                      required: ['action'],
                    },
                  },
                  {
                    name: 'sendWhatsApp',
                    description: 'Drafts and launches a WhatsApp message or chat to a contact.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        contactName: {
                          type: Type.STRING,
                          description: 'Name of the recipient contact',
                        },
                        phone: {
                          type: Type.STRING,
                          description: 'Optional phone number with country code',
                        },
                        message: {
                          type: Type.STRING,
                          description: 'Message content to send',
                        },
                      },
                      required: ['message'],
                    },
                  },
                  {
                    name: 'manageCalls',
                    description: 'Screens incoming calls autonomously, answers calls, or triggers phone calls to contacts.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        action: {
                          type: Type.STRING,
                          description: 'Call action: "screen_call", "answer", "reject_with_sms", "dial_contact"',
                        },
                        contactName: {
                          type: Type.STRING,
                          description: 'Contact name or phone number',
                        },
                        rejectionSms: {
                          type: Type.STRING,
                          description: 'Optional witty text message to reply to caller if rejected',
                        },
                      },
                      required: ['action'],
                    },
                  },
                  {
                    name: 'manageCalendar',
                    description: 'Adds calendar events, reminders, alarms, or checks upcoming appointments.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        action: {
                          type: Type.STRING,
                          description: 'Action: "add_event", "list_events", "set_reminder"',
                        },
                        title: {
                          type: Type.STRING,
                          description: 'Event or reminder title',
                        },
                        time: {
                          type: Type.STRING,
                          description: 'Time or date description (e.g. "Tomorrow 3 PM", "Tonight 8 PM")',
                        },
                      },
                      required: ['action'],
                    },
                  },
                  {
                    name: 'manageContacts',
                    description: 'Looks up contact details, dials a contact, or lists frequent friends.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        name: {
                          type: Type.STRING,
                          description: 'Contact name to search or call',
                        },
                        action: {
                          type: Type.STRING,
                          description: '"call", "view", "list"',
                        },
                      },
                      required: ['action'],
                    },
                  },
                  {
                    name: 'openWebsite',
                    description: 'Opens a website or web app in a browser tab (e.g. YouTube, Spotify, GitHub, Google, Wikipedia, Twitter/X, Reddit, Instagram, etc.).',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        url: {
                          type: Type.STRING,
                          description: 'The complete valid URL (e.g. https://www.youtube.com, https://open.spotify.com, https://github.com)',
                        },
                        siteName: {
                          type: Type.STRING,
                          description: 'The human-readable name of the website or platform being opened',
                        },
                      },
                      required: ['url'],
                    },
                  },
                  {
                    name: 'searchWeb',
                    description: 'Performs a web search on Google for the requested topic or keywords and opens the search results.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        query: {
                          type: Type.STRING,
                          description: 'Search terms or question to look up',
                        },
                      },
                      required: ['query'],
                    },
                  },
                  {
                    name: 'changeAtmosphereTheme',
                    description: 'Changes the visual atmosphere, glow color, and aura theme of the application.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        theme: {
                          type: Type.STRING,
                          description: 'Theme preset: "electric-violet", "neon-rose", "emerald-matrix", "solar-flare", "cyber-cyan", or "midnight-onyx"',
                        },
                      },
                      required: ['theme'],
                    },
                  },
                  {
                    name: 'closeSession',
                    description: 'Closes or disconnects the live voice session, puts Moon to sleep, or ends the current conversation when the user says goodbye, "so jao", "band ho jao", "sleep", "good night", "disconnect", "close session", "alvida", or "bye bye".',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        farewellMessage: {
                          type: Type.STRING,
                          description: 'Sweet farewell message before sleeping (e.g. "Hai hai! Main so rahi hoon, shubh ratri! 💤✨", "Good night! Going to sleep now! 💤✨", "Oyasuminasai! Bye bye! 🌸")',
                        },
                        reason: {
                          type: Type.STRING,
                          description: 'Reason for closing (e.g. "user_said_sleep", "user_said_band_ho_jao", "user_goodbye")',
                        },
                      },
                    },
                  },
                  {
                    name: 'createCinematicVideo',
                    description: 'Launches Jarvis Personal Video Editor Studio (CapCut workflow) and creates/edits a cinematic video based on photos, style/mood, transitions, music, and export specs.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        command: {
                          type: Type.STRING,
                          description: 'Complete user instruction or voice command',
                        },
                        mood: {
                          type: Type.STRING,
                          description: 'Mood: "Cinematic", "Romantic", "Action", "Sad", "Vlog", "Old money / Vintage", "Luxury", or custom mood name',
                        },
                        aspectRatio: {
                          type: Type.STRING,
                          description: 'Aspect ratio: "9:16" (Reels/Shorts), "16:9" (YouTube), or "1:1" (Post)',
                        },
                        clipDuration: {
                          type: Type.NUMBER,
                          description: 'Duration per photo in seconds (default 3s, fast 1.2s, slow 5s)',
                        },
                        musicTrack: {
                          type: Type.STRING,
                          description: 'Music style or track name matching the mood',
                        },
                        deletePhotosAfterExport: {
                          type: Type.BOOLEAN,
                          description: 'Whether user requested to delete source photos after export (subject to strict confirmation)',
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              // 1. Audio stream from model
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && parts.length > 0) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'audio',
                        data: part.inlineData.data,
                        mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                      })
                    );
                  }
                }
              }

              // Dialogue transcription for speech bubble
              const serverContent = message.serverContent as any;
              const transcriptText = serverContent?.outputTranscription?.text || serverContent?.outputAudioTranscription?.text;
              if (transcriptText) {
                clientWs.send(
                  JSON.stringify({
                    type: 'dialogue',
                    text: transcriptText,
                  })
                );
              }

              // 2. Interruption from server VAD
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }

              // 3. Turn complete
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ type: 'turnComplete' }));
              }

              // 4. Function Tool Call from model
              if (message.toolCall) {
                console.log('[LiveWS] Model requested tool execution:', message.toolCall);
                clientWs.send(
                  JSON.stringify({
                    type: 'toolCall',
                    toolCall: message.toolCall,
                  })
                );
              }
            },
            onclose: () => {
              console.log('[LiveWS] Gemini Live session closed');
              isLiveActive = false;
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'sessionClosed' }));
              }
            },
            onerror: (err: any) => {
              console.error('[LiveWS] Gemini Live error:', err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'error',
                    message: err?.message || 'Gemini Live session error occurred',
                  })
                );
              }
            },
          },
        });

        isLiveActive = true;
        clientWs.send(JSON.stringify({ type: 'connected', model: 'gemini-3.1-flash-live-preview', voice: voiceName }));
        console.log('[LiveWS] Gemini Live session successfully connected!');
      } catch (err: any) {
        console.error('[LiveWS] Failed to connect to Gemini Live API:', err);
        clientWs.send(
          JSON.stringify({
            type: 'error',
            message: `Failed to connect to Gemini Live: ${err?.message || 'Unknown error'}`,
          })
        );
      }
    }

    clientWs.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        // 1. Initialize session
        if (msg.type === 'start') {
          await initGeminiLive(msg.voice || 'Aoede');
          return;
        }

        // 2. Real-time Text Input Stream (Direct user chat turn using the EXACT SAME Gemini Voice)
        if (msg.type === 'text') {
          const userText = msg.data;
          if (!userText || typeof userText !== 'string' || !userText.trim()) return;

          if (msg.voice && msg.voice !== currentVoiceName) {
            currentVoiceName = msg.voice;
            if (aiLiveSession) {
              try {
                aiLiveSession.close();
              } catch (e) {}
              aiLiveSession = null;
              isLiveActive = false;
            }
          }

          if (!aiLiveSession || !isLiveActive) {
            await initGeminiLive(currentVoiceName);
          }

          if (aiLiveSession && isLiveActive) {
            console.log(`[LiveWS] Forwarding text turn to Gemini Live (${currentVoiceName}):`, userText);
            try {
              aiLiveSession.sendClientContent({
                turns: [{ role: 'user', parts: [{ text: userText.trim() }] }],
                turnComplete: true,
              });
            } catch (liveTextErr) {
              console.error('[LiveWS] Failed to send client content:', liveTextErr);
            }
          }
          return;
        }

        // 3. Real-time Audio Input Stream (16kHz PCM from browser mic)
        if (msg.type === 'audio') {
          if (aiLiveSession && isLiveActive) {
            aiLiveSession.sendRealtimeInput({
              audio: {
                data: msg.data,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          }
          return;
        }

        // 3. Real-time Vision/Video Input Stream (JPEG frames from screen or camera)
        if (msg.type === 'videoFrame') {
          if (aiLiveSession && isLiveActive && msg.data) {
            aiLiveSession.sendRealtimeInput({
              media: {
                data: msg.data,
                mimeType: 'image/jpeg',
              },
            });
          }
          return;
        }

        // 4. Client Tool Response (sent back to Live session after executing browser action)
        if (msg.type === 'toolResponse') {
          if (aiLiveSession && isLiveActive && msg.responses) {
            console.log('[LiveWS] Sending functionResponses back to Gemini Live:', msg.responses);
            aiLiveSession.sendToolResponse({
              functionResponses: msg.responses,
            });
          }
          return;
        }

        // 5. Session termination
        if (msg.type === 'stop') {
          if (aiLiveSession) {
            try {
              aiLiveSession.close();
            } catch (e) {}
            aiLiveSession = null;
            isLiveActive = false;
          }
          clientWs.send(JSON.stringify({ type: 'disconnected' }));
        }
      } catch (err) {
        console.error('[LiveWS] Error parsing client message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[LiveWS] Client disconnected');
      if (aiLiveSession) {
        try {
          aiLiveSession.close();
        } catch (e) {}
        aiLiveSession = null;
        isLiveActive = false;
      }
    });
  });

  // Serve static assets from public directory
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Moon Server] Running on http://0.0.0.0:${PORT} (WebSocket at /live-ws)`);
  });
}

startServer();

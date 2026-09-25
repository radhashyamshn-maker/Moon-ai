package com.moonai.companion;

import android.animation.ValueAnimator;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import androidx.core.app.NotificationCompat;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * SystemOverlayService
 * Renders an interactive, touch-through system overlay (TYPE_APPLICATION_OVERLAY)
 * over Android OS, home screen, and all third-party applications (WhatsApp, YouTube, etc.)
 * Displays rising water bubbles, blooming floral petals along screen borders,
 * and a glowing "JARVIS Active" badge at top-right.
 */
public class SystemOverlayService extends Service {

    public static final String ACTION_START_OVERLAY = "com.moonai.companion.START_OVERLAY";
    public static final String ACTION_STOP_OVERLAY = "com.moonai.companion.STOP_OVERLAY";
    public static final String EXTRA_BADGE_TEXT = "extra_badge_text";

    private static final String CHANNEL_ID = "moon_ai_overlay_channel";
    private static final int NOTIFICATION_ID = 9001;

    private WindowManager windowManager;
    private OverlayCanvasView overlayView;
    private boolean isOverlayAdded = false;
    private String badgeText = "JARVIS Active";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_STOP_OVERLAY.equals(action)) {
                stopOverlay();
                stopForeground(true);
                stopSelf();
                return START_NOT_STICKY;
            } else if (ACTION_START_OVERLAY.equals(action)) {
                if (intent.hasExtra(EXTRA_BADGE_TEXT)) {
                    badgeText = intent.getStringExtra(EXTRA_BADGE_TEXT);
                }
                startForeground(NOTIFICATION_ID, buildForegroundNotification());
                showOverlay();
                return START_STICKY;
            }
        }
        return START_NOT_STICKY;
    }

    private void showOverlay() {
        if (isOverlayAdded) {
            if (overlayView != null) {
                overlayView.setBadgeText(badgeText);
                overlayView.invalidate();
            }
            return;
        }

        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        if (windowManager == null) return;

        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            @SuppressWarnings("deprecation")
            int oldType = WindowManager.LayoutParams.TYPE_PHONE;
            layoutType = oldType;
        }

        // FLAG_NOT_TOUCHABLE | FLAG_NOT_FOCUSABLE ensures 100% TOUCH-THROUGH
        // so user touches all underlying apps (WhatsApp, Home, YouTube) without any interruption
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                        | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;

        overlayView = new OverlayCanvasView(this, badgeText);
        try {
            windowManager.addView(overlayView, params);
            isOverlayAdded = true;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void stopOverlay() {
        if (isOverlayAdded && overlayView != null && windowManager != null) {
            try {
                overlayView.stopAnimation();
                windowManager.removeView(overlayView);
            } catch (Exception e) {
                e.printStackTrace();
            }
            overlayView = null;
            isOverlayAdded = false;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "JARVIS System Overlay & Voice Session",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active voice session and background edge aura");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildForegroundNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                launchIntent != null ? launchIntent : new Intent(),
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                        ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                        : PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(badgeText + " • Session Active")
                .setContentText("Edge Aura Water Bubbles & Floral Particles Active")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();
    }

    @Override
    public void onDestroy() {
        stopOverlay();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    /**
     * OverlayCanvasView: Custom view that draws ascending water bubbles,
     * blooming flower petals on screen borders, and top-right JARVIS Active badge.
     */
    public static class OverlayCanvasView extends View {

        private final Random random = new Random();
        private final Paint bubblePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint bubbleRimPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint flowerPetalPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint flowerCenterPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint badgeBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint badgeBorderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint badgeTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint pulseDotPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

        private final List<Particle> particles = new ArrayList<>();
        private ValueAnimator animator;
        private String badgeText;
        private float pulsePhase = 0f;

        public OverlayCanvasView(Context context, String badgeText) {
            super(context);
            this.badgeText = badgeText;
            initPaints();
            initAnimator();
        }

        public void setBadgeText(String text) {
            this.badgeText = text;
        }

        private void initPaints() {
            bubbleRimPaint.setStyle(Paint.Style.STROKE);
            bubbleRimPaint.setStrokeWidth(2f);
            bubbleRimPaint.setColor(Color.argb(120, 186, 230, 253));

            flowerPetalPaint.setStyle(Paint.Style.FILL);
            flowerCenterPaint.setStyle(Paint.Style.FILL);
            flowerCenterPaint.setColor(Color.argb(230, 253, 224, 71));

            badgeBgPaint.setStyle(Paint.Style.FILL);
            badgeBgPaint.setColor(Color.argb(220, 10, 15, 29));

            badgeBorderPaint.setStyle(Paint.Style.STROKE);
            badgeBorderPaint.setStrokeWidth(2.5f);
            badgeBorderPaint.setColor(Color.argb(180, 6, 182, 212));

            badgeTextPaint.setStyle(Paint.Style.FILL);
            badgeTextPaint.setColor(Color.argb(240, 103, 232, 249));
            badgeTextPaint.setTextSize(32f);
            badgeTextPaint.setFakeBoldText(true);

            pulseDotPaint.setStyle(Paint.Style.FILL);
            pulseDotPaint.setColor(Color.argb(240, 34, 211, 238));
        }

        private void initAnimator() {
            animator = ValueAnimator.ofFloat(0f, 1f);
            animator.setDuration(16);
            animator.setRepeatCount(ValueAnimator.INFINITE);
            animator.addUpdateListener(animation -> {
                pulsePhase += 0.05f;
                updateParticles();
                invalidate();
            });
            animator.start();
        }

        public void stopAnimation() {
            if (animator != null) {
                animator.cancel();
            }
        }

        private void ensureParticles(int w, int h) {
            if (particles.isEmpty() && w > 0 && h > 0) {
                int count = 35;
                for (int i = 0; i < count; i++) {
                    particles.add(createParticle(w, h, true));
                }
            }
        }

        private Particle createParticle(int w, int h, boolean initialSpread) {
            Particle p = new Particle();
            boolean isLeft = random.nextBoolean();
            float borderSpan = Math.min(120f, w * 0.18f);

            p.baseX = isLeft ? (random.nextFloat() * borderSpan + 12f)
                             : (w - (random.nextFloat() * borderSpan + 12f));
            p.x = p.baseX;
            p.y = initialSpread ? random.nextFloat() * h : (h + random.nextFloat() * 60f + 20f);
            p.isFlower = random.nextFloat() > 0.45f;
            p.radius = p.isFlower ? (random.nextFloat() * 14f + 16f) : (random.nextFloat() * 18f + 12f);
            p.speedY = random.nextFloat() * 2.5f + 1.2f;
            p.wobbleSpeed = random.nextFloat() * 0.04f + 0.015f;
            p.wobbleAmplitude = random.nextFloat() * 20f + 8f;
            p.wobblePhase = random.nextFloat() * 6.28f;
            p.rotation = random.nextFloat() * 360f;
            p.rotationSpeed = (random.nextFloat() - 0.5f) * 1.5f;
            p.bloomScale = 0.3f;
            p.colorHue = p.isFlower ? (random.nextBoolean() ? 330f : 270f) : 195f; // Pink/purple flower or cyan bubble
            return p;
        }

        private void updateParticles() {
            int w = getWidth();
            int h = getHeight();
            if (w <= 0 || h <= 0) return;

            ensureParticles(w, h);

            for (Particle p : particles) {
                p.y -= p.speedY;
                p.wobblePhase += p.wobbleSpeed;
                p.x = p.baseX + (float) Math.sin(p.wobblePhase) * p.wobbleAmplitude;
                p.rotation += p.rotationSpeed;
                if (p.bloomScale < 1.0f) {
                    p.bloomScale = Math.min(1.0f, p.bloomScale + 0.015f);
                }

                if (p.y < -p.radius * 2) {
                    Particle fresh = createParticle(w, h, false);
                    p.baseX = fresh.baseX;
                    p.x = fresh.x;
                    p.y = fresh.y;
                    p.isFlower = fresh.isFlower;
                    p.radius = fresh.radius;
                    p.speedY = fresh.speedY;
                    p.bloomScale = 0.25f;
                    p.colorHue = fresh.colorHue;
                }
            }
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            int w = getWidth();
            int h = getHeight();
            if (w <= 0 || h <= 0) return;

            // 1. Draw Particles (Edge Bubbles and Blooming Flowers)
            for (Particle p : particles) {
                if (!p.isFlower) {
                    // Draw Water Bubble with 3D reflection
                    RadialGradient gradient = new RadialGradient(
                            p.x - p.radius * 0.3f,
                            p.y - p.radius * 0.3f,
                            p.radius,
                            Color.argb(160, 255, 255, 255),
                            Color.argb(80, 14, 165, 233),
                            Shader.TileMode.CLAMP
                    );
                    bubblePaint.setShader(gradient);
                    canvas.drawCircle(p.x, p.y, p.radius, bubblePaint);
                    canvas.drawCircle(p.x, p.y, p.radius, bubbleRimPaint);

                    // Specular highlight glint
                    Paint glint = new Paint(Paint.ANTI_ALIAS_FLAG);
                    glint.setColor(Color.argb(200, 255, 255, 255));
                    canvas.drawCircle(p.x - p.radius * 0.35f, p.y - p.radius * 0.35f, p.radius * 0.25f, glint);
                } else {
                    // Draw Blooming 5-Petal Flower
                    canvas.save();
                    canvas.translate(p.x, p.y);
                    canvas.rotate(p.rotation);
                    canvas.scale(p.bloomScale, p.bloomScale);

                    int petalColor = p.colorHue > 300
                            ? Color.argb(170, 244, 114, 182) // Pink Sakura
                            : Color.argb(170, 192, 132, 252); // Purple Lotus
                    flowerPetalPaint.setColor(petalColor);

                    int numPetals = 5;
                    float petalDist = p.radius * 0.85f;
                    for (int i = 0; i < numPetals; i++) {
                        canvas.save();
                        canvas.rotate((360f / numPetals) * i);
                        Path path = new Path();
                        path.moveTo(0, 0);
                        path.quadTo(-p.radius * 0.45f, -petalDist * 0.5f, 0, -petalDist);
                        path.quadTo(p.radius * 0.45f, -petalDist * 0.5f, 0, 0);
                        canvas.drawPath(path, flowerPetalPaint);
                        canvas.restore();
                    }
                    // Pollen Center
                    canvas.drawCircle(0, 0, p.radius * 0.28f, flowerCenterPaint);
                    canvas.restore();
                }
            }

            // 2. Draw Top-Right Floating "JARVIS Active" Pill Badge
            float badgeW = 280f;
            float badgeH = 75f;
            float badgeX = w - badgeW - 35f;
            float badgeY = 65f;
            float cornerRadius = 37.5f;

            // Background pill
            canvas.drawRoundRect(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH, cornerRadius, cornerRadius, badgeBgPaint);
            canvas.drawRoundRect(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH, cornerRadius, cornerRadius, badgeBorderPaint);

            // Pulsing status dot
            float dotX = badgeX + 32f;
            float dotY = badgeY + badgeH / 2f;
            float pulseR = 9f + (float) Math.sin(pulsePhase) * 3f;
            pulseDotPaint.setAlpha((int) (180 + Math.sin(pulsePhase) * 60));
            canvas.drawCircle(dotX, dotY, pulseR, pulseDotPaint);

            // Badge text
            canvas.drawText(badgeText, dotX + 22f, dotY + 11f, badgeTextPaint);
        }

        private static class Particle {
            float x, y, baseX;
            boolean isFlower;
            float radius;
            float speedY;
            float wobbleSpeed;
            float wobbleAmplitude;
            float wobblePhase;
            float rotation;
            float rotationSpeed;
            float bloomScale;
            float colorHue;
        }
    }
}

/**
 * HRL Traffic Tracking - Ana Tracking Scripti
 * 
 * Bu dosya mağaza sayfalarına enjekte edilen ana tracking scriptidir.
 * Theme App Extension tarafından otomatik olarak yüklenir.
 */

(function() {
  'use strict';
  
  // Global HRL Tracking namespace
  window.HRLTracking = {
    version: '1.0.0',
    isLoaded: function() { return true; },
    config: {},
    sessionId: null,
    userId: null,
    
    // Başlatma fonksiyonu
    init: function() {
      console.log('🚀 HRL Tracking: Ana script yüklendi');
      
      // Session ID oluştur
      this.sessionId = this.generateSessionId();
      this.userId = this.generateUserId();
      
      // Konfigürasyonu al
      this.loadConfig();
      
      // Event listener'ları ekle
      this.setupEventListeners();
      
      // Sayfa görüntüleme eventi gönder
      this.trackPageView();
      
      // Heartbeat başlat
      this.startHeartbeat();
      
      console.log('✅ HRL Tracking: Başarıyla başlatıldı');
    },
    
    // Session ID oluştur
    generateSessionId: function() {
      let sessionId = localStorage.getItem('hrl_session_id');
      if (!sessionId) {
        sessionId = 'hrl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('hrl_session_id', sessionId);
      }
      return sessionId;
    },
    
    // User ID oluştur
    generateUserId: function() {
      let userId = localStorage.getItem('hrl_user_id');
      if (!userId) {
        userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('hrl_user_id', userId);
      }
      return userId;
    },
    
    // Konfigürasyon yükle
    loadConfig: function() {
      const script = document.querySelector('script[src*="tracking.js"]');
      if (script) {
        const url = new URL(script.src);
        const baseUrl = url.origin + url.pathname.replace('/tracking.js', '');
        
        this.config = {
          baseUrl: baseUrl,
          endpoints: {
            collect: baseUrl + '/collect',
            config: baseUrl + '/config.json'
          },
          shop: window.Shopify?.shop || 'unknown',
          timestamp: Date.now()
        };
        
        console.log('📋 HRL Tracking: Konfigürasyon yüklendi', this.config);
      }
    },
    
    // Event listener'ları kur
    setupEventListeners: function() {
      // Sayfa görüntüleme
      window.addEventListener('pagehide', () => {
        this.trackEvent('page_hide');
      });
      
      // Sayfa değişikliği (SPA için)
      window.addEventListener('popstate', () => {
        this.trackPageView();
      });
      
      // Visibility değişikliği
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.trackEvent('page_hide');
        } else {
          this.trackEvent('page_show');
        }
      });
    },
    
    // Sayfa görüntüleme takibi
    trackPageView: function() {
      const pageData = {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        shop: this.config.shop
      };
      
      this.trackEvent('page_view', pageData);
    },
    
    // Event gönder
    trackEvent: function(eventType, data = {}) {
      if (!this.config.baseUrl) {
        console.warn('⚠️ HRL Tracking: Konfigürasyon yüklenmedi');
        return;
      }
      
      const eventData = {
        type: eventType,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        shop: this.config.shop,
        page: {
          url: window.location.href,
          title: document.title,
          referrer: document.referrer
        },
        userAgent: navigator.userAgent,
        language: navigator.language,
        ...data
      };
      
      // Console'da göster (development için)
      console.log('📊 HRL Tracking Event:', eventType, eventData);
      
      // Sunucuya gönder
      this.sendToServer(eventData);
    },
    
    // Sunucuya veri gönder
    sendToServer: function(data) {
      if (!this.config.endpoints?.collect) {
        return;
      }
      
      // Fetch ile gönder
      fetch(this.config.endpoints.collect, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(result => {
        console.log('✅ HRL Tracking: Veri gönderildi', result);
      })
      .catch(error => {
        console.warn('⚠️ HRL Tracking: Veri gönderme hatası', error);
      });
    },
    
    // Heartbeat başlat
    startHeartbeat: function() {
      // Her 30 saniyede bir heartbeat gönder
      setInterval(() => {
        this.trackEvent('heartbeat', {
          duration: Date.now() - (this.config.timestamp || Date.now())
        });
      }, 30000);
    },
    
    // Debug bilgileri
    getDebugInfo: function() {
      return {
        version: this.version,
        sessionId: this.sessionId,
        userId: this.userId,
        config: this.config,
        isLoaded: this.isLoaded()
      };
    }
  };
  
  // Sayfa yüklendiğinde başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.HRLTracking.init();
    });
  } else {
    window.HRLTracking.init();
  }
  
  // Global debug fonksiyonu
  window.getHRLTrackingDebug = function() {
    return window.HRLTracking.getDebugInfo();
  };
  
})();

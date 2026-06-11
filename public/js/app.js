/**
 * @fileoverview Main coordinator for the CarbonSaathi AI client.
 * Manages active pages, shared states, local storage, and notification toasts.
 * @module public/js/app
 */

const App = {
  state: {
    profile: null,        // Onboarding user profile context
    activities: [],       // Today's logged activities array
    totalToday: 0,        // Total daily emissions (kg CO2e)
    breakdown: {},        // Category percentages (0 to 1 range)
    streak: 0,            // Consecutive daily tracking streak
    lastLogDate: null,    // Date string representing last activity logged
    currentPage: 'onboarding'
  },

  /**
   * Initializes the application. Loads stored profiles and routes to active section.
   * @returns {void}
   */
  init() {
    App.Storage.load();
    App.setupNavListeners();

    if (App.state.profile) {
      App.showNav();
      App.showPage('dashboard');
    } else {
      App.showPage('onboarding');
      if (App.Onboarding && typeof App.Onboarding.init === 'function') {
        App.Onboarding.init();
      }
    }
  },

  /**
   * Setup click listeners for nav bar page navigation.
   * @returns {void}
   */
  setupNavListeners() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const pageId = btn.getAttribute('data-page');
        App.showPage(pageId);
      });
    });
  },

  /**
   * Transitions app viewport to show requested page.
   * @param {string} pageId - Target page ID ('dashboard', 'logger', 'insights', etc).
   * @returns {void}
   */
  showPage(pageId) {
    App.state.currentPage = pageId;

    // Hide all pages and reveal target page
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
      p.classList.remove('active');
    });

    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Update nav button active states
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      if (btn.getAttribute('data-page') === pageId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Run hook initializers for specific modules
    if (pageId === 'dashboard' && App.Dashboard) {
      App.Dashboard.render();
    } else if (pageId === 'logger' && App.Logger) {
      App.Logger.init();
    } else if (pageId === 'insights' && App.Insights) {
      App.Insights.init();
    } else if (pageId === 'challenges' && App.Challenges) {
      App.Challenges.init();
    } else if (pageId === 'simulator' && App.Simulator) {
      App.Simulator.render();
    }
  },

  /**
   * Displays the navigation bar once user has onboarded.
   * @returns {void}
   */
  showNav() {
    const nav = document.getElementById('main-nav');
    if (nav) {
      nav.classList.remove('hidden');
    }
  },

  /**
   * Notification engine to pop transient messages.
   */
  Toast: {
    /**
     * Spawns a new alert banner.
     * @param {string} message - Notice contents.
     * @param {string} [type='success'] - Alert categorization ('success', 'warning', 'error').
     * @returns {void}
     */
    show(message, type = 'success') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      toast.setAttribute('role', 'alert');

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, 3000);
    }
  },

  /**
   * Handles local storage synchronization.
   */
  Storage: {
    /**
     * Serializes and writes active state values to local storage.
     * @returns {void}
     */
    save() {
      localStorage.setItem('cs_state', JSON.stringify(App.state));
    },

    /**
     * Reads and deserializes active state values from local storage.
     * @returns {void}
     */
    load() {
      const saved = localStorage.getItem('cs_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const today = new Date().toDateString();

          // Reset activities daily
          if (parsed.lastLogDate !== today) {
            parsed.activities = [];
            parsed.totalToday = 0;
            parsed.breakdown = {};

            // Continuous streak logic
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (parsed.lastLogDate !== yesterday.toDateString()) {
              parsed.streak = 0;
            }
          }

          Object.assign(App.state, parsed);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to parse local state storage data', e);
        }
      }
    },

    /**
     * Resets local storage caches.
     * @returns {void}
     */
    clear() {
      localStorage.removeItem('cs_state');
    }
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());

/**
 * @fileoverview AI Coach insights module for CarbonSaathi AI.
 * Handles the conversation feed, loading indicators, and user questions queries.
 * @module public/js/insights
 */

App.Insights = {
  chatWindow: null,
  chatForm: null,
  generateBtn: null,

  /**
   * Initializes DOM bindings for the insights view.
   * @returns {void}
   */
  init() {
    App.Insights.chatWindow = document.getElementById('insights-chat-window');
    App.Insights.chatForm = document.getElementById('insights-chat-form');
    App.Insights.generateBtn = document.getElementById('insights-generate-btn');

    if (App.Insights.generateBtn) {
      App.Insights.generateBtn.onclick = () => App.Insights.getInsights();
    }

    if (App.Insights.chatForm) {
      App.Insights.chatForm.onsubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('insights-user-input');
        const message = input.value.trim();
        if (message) {
          input.value = '';
          App.Insights.askQuestion(message);
        }
      };
    }
  },

  /**
   * Displays the typing dots bubble in the chat view.
   * @returns {void}
   */
  showTyping() {
    const indicator = document.createElement('div');
    indicator.id = 'insights-typing';
    indicator.className = 'typing-indicator';
    indicator.innerHTML = DOMPurify.sanitize(`
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `);
    App.Insights.chatWindow?.appendChild(indicator);
    App.Insights.scrollToBottom();
  },

  /**
   * Removes the active typing indicator element.
   * @returns {void}
   */
  hideTyping() {
    const indicator = document.getElementById('insights-typing');
    if (indicator) {
      indicator.remove();
    }
  },

  /**
   * Ensures the scroll context stays anchored at the bottom of the conversation feed.
   * @returns {void}
   */
  scrollToBottom() {
    if (App.Insights.chatWindow) {
      App.Insights.chatWindow.scrollTop = App.Insights.chatWindow.scrollHeight;
    }
  },

  /**
   * Fetches AI carbon diagnostics recommendation block.
   * @returns {Promise<void>}
   */
  async getInsights() {
    if (App.state.activities.length === 0) {
      App.Toast.show('Log some activities today before running AI analysis.', 'error');
      return;
    }

    App.Insights.showTyping();
    if (App.Insights.generateBtn) {
      App.Insights.generateBtn.disabled = true;
    }

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activities: App.state.activities,
          profile: App.state.profile
        })
      });

      App.Insights.hideTyping();

      if (!response.ok) {
        throw new Error('AI Coach is temporarily offline.');
      }

      const result = await response.json();
      const { decision, explanation } = result;

      // Append Coach Answer bubble
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble coach-bubble';

      const trees = decision.treeEquivalent;
      const km = (decision.estimatedSavingKg / 0.21).toFixed(1);
      const phone = Math.round(decision.estimatedSavingKg / 0.005);
      const ac = Math.round(decision.estimatedSavingKg / 0.021);

      bubble.innerHTML = DOMPurify.sanitize(`
        <div class="bubble-content">
          <div class="mitigation-content" style="margin-bottom: 12px; border-left-color: var(--primary);">
            <div class="mitigation-title">COACH DIAGNOSTIC: ${decision.category.toUpperCase()}</div>
            <div class="mitigation-action">👉 ${decision.action}</div>
            <div class="mitigation-reason">Est. Savings: ${decision.estimatedSavingKg} kg CO₂ / Month</div>
          </div>
          <p style="margin-bottom: 12px; font-weight: 500;">${explanation}</p>
          <div class="comparison-chips-container">
            <div class="comparison-chip" aria-label="🌳 ${trees} Tree Equivalents">
              <span>🌳 Trees:</span> <span class="chip-val">${trees}</span>
            </div>
            <div class="comparison-chip" aria-label="🚗 ${km} Kilometers avoided">
              <span>🚗 Car:</span> <span class="chip-val">${km} km</span>
            </div>
            <div class="comparison-chip" aria-label="📱 ${phone} Phone charges">
              <span>📱 Phone:</span> <span class="chip-val">${phone}</span>
            </div>
            <div class="comparison-chip" aria-label="❄️ ${ac} AC minutes saved">
              <span>❄️ AC:</span> <span class="chip-val">${ac} mins</span>
            </div>
          </div>
        </div>
      `);

      App.Insights.chatWindow?.appendChild(bubble);
      App.Insights.scrollToBottom();

      // Show Chat input
      if (App.Insights.chatForm) {
        App.Insights.chatForm.classList.remove('hidden');
      }
    } catch (err) {
      App.Insights.hideTyping();
      App.Toast.show(err.message || 'Connection lost, try again.', 'error');
    } finally {
      if (App.Insights.generateBtn) {
        App.Insights.generateBtn.disabled = false;
      }
    }
  },

  /**
   * Appends user query and fetches follow-up advice bubble.
   * @param {string} userMessage - Text message entered by user.
   * @returns {Promise<void>}
   */
  async askQuestion(userMessage) {
    // Append User Bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user-bubble';
    userBubble.innerHTML = DOMPurify.sanitize(`<p>${userMessage}</p>`);
    App.Insights.chatWindow?.appendChild(userBubble);
    App.Insights.scrollToBottom();

    App.Insights.showTyping();

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activities: App.state.activities,
          profile: App.state.profile,
          message: userMessage
        })
      });

      App.Insights.hideTyping();

      if (!response.ok) {
        throw new Error('AI Coach connection timeout.');
      }

      const result = await response.json();

      const coachBubble = document.createElement('div');
      coachBubble.className = 'chat-bubble coach-bubble';
      coachBubble.innerHTML = DOMPurify.sanitize(`<p>${result.explanation}</p>`);

      App.Insights.chatWindow?.appendChild(coachBubble);
      App.Insights.scrollToBottom();
    } catch (err) {
      App.Insights.hideTyping();
      App.Toast.show(err.message || 'Connection lost, try again.', 'error');
    }
  }
};

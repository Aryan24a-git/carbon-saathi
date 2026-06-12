/**
 * @fileoverview Challenges UI module for CarbonSaathi AI.
 * Handles current challenge loading, marking progress, and adaptive card updates.
 * @module public/js/challenges
 */

App.Challenges = {
  activeChallenge: null,

  /**
   * Initializes the challenges panel. Fetches the current personal challenge.
   * @returns {Promise<void>}
   */
  async init() {
    const container = document.getElementById('challenges-display-container');
    if (!container) return;

    container.innerHTML = '<p class="muted-text">Loading your weekly challenge...</p>';

    try {
      const profileStr = encodeURIComponent(JSON.stringify(App.state.profile || {}));

      // Look up if we have a last completed/failed challenge ID to adjust difficulty
      const historyStr = App.Challenges.activeChallenge
        ? encodeURIComponent(JSON.stringify({
            lastChallengeId: App.Challenges.activeChallenge.id,
            completed: App.Challenges.activeChallenge.completed || false
          }))
        : '';

      const response = await fetch(`/api/challenges/current?profile=${profileStr}&history=${historyStr}`);
      if (!response.ok) {
        throw new Error('Could not retrieve challenges.');
      }

      const result = await response.json();
      App.Challenges.activeChallenge = result.challenge;

      App.Challenges.renderChallenge(result);
    } catch (err) {
      container.innerHTML = `<p class="muted-text">Offline Mode: Active challenges temporarily unavailable.</p>`;
    }
  },

  /**
   * Renders the challenge item inside the dashboard container.
   * @param {Object} data - Challenge metadata.
   * @returns {void}
   */
  renderChallenge(data) {
    const container = document.getElementById('challenges-display-container');
    if (!container) return;

    const c = data.challenge;
    const end = new Date(data.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    container.innerHTML = `
      <div class="challenge-card-item" id="challenge-card-${c.id}">
        <div class="challenge-title-row">
          <span class="cat-icon" style="font-size: 1.5rem;">${c.icon}</span>
          <h4>${c.title}</h4>
        </div>
        <p class="challenge-desc">${c.description}</p>

        <div class="challenge-stats">
          <div>Difficulty: <span class="challenge-stat-val" style="color: var(--accent);">${c.difficulty.toUpperCase()}</span></div>
          <div>Saves: <span class="challenge-stat-val">${c.targetKgSaved} kg CO₂</span></div>
          <div>Ends: <span class="challenge-stat-val">${end}</span></div>
        </div>

        <p class="ring-caption" style="text-align: left; font-size: 0.8rem; margin: 4px 0;">
          💡 <em>${data.reasoning}</em>
        </p>

        <div class="challenge-actions">
          <button class="btn btn-primary" onclick="App.Challenges.markComplete('${c.id}')" aria-label="Mark challenge ${c.title} as completed">Mark Complete</button>
          <button class="btn btn-secondary" onclick="App.Challenges.markFailed('${c.id}')" aria-label="Mark challenge ${c.title} as failed">Skip / Fail</button>
        </div>
      </div>
    `;
  },

  /**
   * Posts completion status, increments streak counts, and renders next challenge suggestions.
   * @param {string} challengeId - Unique ID of challenge.
   * @returns {Promise<void>}
   */
  async markComplete(challengeId) {
    try {
      const response = await fetch('/api/challenges/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          challengeId,
          completed: true
        })
      });

      if (!response.ok) {
        throw new Error('Evaluation request failed');
      }

      const result = await response.json();

      // Update local state details
      App.state.streak++;
      App.Storage.save();
      App.Dashboard.render();

      App.Toast.show('Challenge complete! 🎉', 'success');

      // Update challenge references
      App.Challenges.activeChallenge = {
        id: result.nextChallenge.id,
        completed: true
      };

      // Reload next challenge
      App.Challenges.init();
    } catch (err) {
      App.Toast.show(err.message || 'Connection lost, try again.', 'error');
    }
  },

  /**
   * Posts failure status and updates UI with the easier challenge option.
   * @param {string} challengeId - Unique ID of challenge.
   * @returns {Promise<void>}
   */
  async markFailed(challengeId) {
    try {
      const response = await fetch('/api/challenges/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          challengeId,
          completed: false
        })
      });

      if (!response.ok) {
        throw new Error('Evaluation request failed');
      }

      const result = await response.json();

      App.Toast.show('No worries! Let\'s scale down to standard actions.', 'warning');

      // Update challenge reference to trigger alternative rendering
      App.Challenges.activeChallenge = {
        id: result.nextChallenge.id,
        completed: false
      };

      // Reload next challenge
      App.Challenges.init();
    } catch (err) {
      App.Toast.show(err.message || 'Connection lost, try again.', 'error');
    }
  }
};

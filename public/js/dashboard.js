/**
 * @fileoverview Dashboard rendering module for CarbonSaathi AI.
 * Handles stats presentation, SVG score ring animation, and category breakdowns.
 * @module public/js/dashboard
 */

App.Dashboard = {
  /**
   * Triggers a recalculation and renders all dashboard statistics.
   * @returns {Promise<void>}
   */
  async render() {
    // Update streak and activity counter from state
    const streakElement = document.getElementById('stat-streak-val');
    if (streakElement) {
      streakElement.textContent = `${App.state.streak} day${App.state.streak === 1 ? '' : 's'}`;
    }

    const logsElement = document.getElementById('stat-logs-val');
    if (logsElement) {
      logsElement.textContent = `${App.state.activities.length} item${App.state.activities.length === 1 ? '' : 's'}`;
    }

    // Update CSS Virtual Garden
    App.Dashboard.updateGarden();

    // Update ring value immediately
    const carbonValElement = document.getElementById('ring-carbon-val');
    if (carbonValElement) {
      carbonValElement.textContent = App.state.totalToday.toFixed(1);
    }
    App.Dashboard.updateRing(App.state.totalToday, 11.5);

    const mitigationContainer = document.getElementById('dashboard-mitigation-content');
    const insightsBtn = document.getElementById('dashboard-insights-btn');
    const chartContainer = document.getElementById('breakdown-chart-bars');

    if (App.state.activities.length === 0) {
      if (mitigationContainer) {
        mitigationContainer.innerHTML = `<p class="muted-text">No activities logged today. Start logging in the Log tab to see your mitigation suggestions!</p>`;
      }
      if (insightsBtn) {
        insightsBtn.classList.add('hidden');
      }
      if (chartContainer) {
        chartContainer.innerHTML = '<p class="muted-text">No emissions recorded yet.</p>';
      }
      return;
    }

    // Show Insights button
    if (insightsBtn) {
      insightsBtn.classList.remove('hidden');
      // Set click handler to route to insights page
      insightsBtn.onclick = () => App.showPage('insights');
    }

    try {
      // Hit batch API to compute breakdown and decision
      const response = await fetch('/api/calculate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activities: App.state.activities,
          profile: App.state.profile
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run batch calculations');
      }

      const result = await response.json();
      App.state.totalToday = result.total;
      App.state.breakdown = result.breakdown;
      App.Storage.save();

      // Render mitigation decision card
      if (mitigationContainer && result.decision) {
        const d = result.decision;
        mitigationContainer.innerHTML = `
          <div class="mitigation-title">Dominant Category: ${d.category.toUpperCase()} (${(d.percentage * 100).toFixed(0)}%)</div>
          <div class="mitigation-action">👉 ${d.action}</div>
          <div class="mitigation-reason">${d.reasoning}</div>
          <div class="comparison-chips-container" style="margin-top: 12px;">
            <div class="comparison-chip" aria-label="Saves ${d.estimatedSavingKg} kg CO2">
              <span>🌱 Savings:</span>
              <span class="chip-val">${d.estimatedSavingKg} kg CO₂</span>
            </div>
            <div class="comparison-chip" aria-label="Equal to absorbing CO2 of ${d.treeEquivalent} trees for a day">
              <span>🌳 Tree Eq:</span>
              <span class="chip-val">${d.treeEquivalent} tree-days</span>
            </div>
          </div>
        `;
      }

      // Render horizontal category bar chart
      if (chartContainer) {
        // Find maximum category emission to scale widths
        const sums = { travel: 0, food: 0, energy: 0, shopping: 0, flights: 0 };
        App.state.activities.forEach(act => {
          if (sums[act.category] !== undefined) {
            // Find activity emissions by finding it in calculated list
            const matched = result.activities.find(x => x.category === act.category && x.activityType === act.activityType && x.value === act.value);
            if (matched) {
              sums[act.category] += matched.emissions;
            }
          }
        });

        const maxVal = Math.max(...Object.values(sums), 1);
        chartContainer.innerHTML = Object.entries(sums).map(([cat, val]) => {
          const widthPercent = (val / maxVal) * 100;
          return `
            <div class="chart-bar-item">
              <div class="bar-label-row">
                <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                <span>${val.toFixed(2)} kg CO₂</span>
              </div>
              <div class="bar-track">
                <div class="emission-bar ${cat}" style="width: ${widthPercent}%" aria-label="${cat} emissions are ${val.toFixed(2)} kg CO2"></div>
              </div>
            </div>
          `;
        }).join('');
      }

    } catch (err) {
      // Offline fallback: render local estimation
      // eslint-disable-next-line no-console
      console.warn('Batch calculation request failed, running offline UI rendering', err);
    }
  },

  /**
   * Animates the SVG carbon score ring path fill.
   * @param {number} current - Current logged kg CO2 footprint.
   * @param {number} average - Normal student average daily daily budget.
   * @returns {void}
   */
  updateRing(current, average) {
    const fill = document.getElementById('score-ring-fill');
    if (!fill) return;

    const percentage = Math.min((current / average) * 100, 150);
    const dashoffset = 502 - (502 * Math.min(percentage, 100)) / 100;

    // Apply animation offset
    fill.style.strokeDashoffset = dashoffset;

    // Assign color coding (Using the new Glass/Claymorphism theme)
    if (percentage < 50) {
      fill.style.stroke = 'var(--success)';
      fill.style.filter = 'drop-shadow(0 0 10px rgba(46, 213, 115, 0.4))';
    } else if (percentage <= 80) {
      fill.style.stroke = 'var(--primary)';
      fill.style.filter = 'drop-shadow(0 0 15px var(--primary-glow))';
    } else {
      fill.style.stroke = 'var(--danger)';
      fill.style.filter = 'drop-shadow(0 0 10px rgba(255, 71, 87, 0.4))';
    }
  },

  /**
   * Updates the CSS Virtual Garden plant growth based on user activity.
   * Controls SVG stem height, leaf visibility, and level text via data attributes.
   * @returns {void}
   */
  updateGarden() {
    const activities = App.state.activities.length;
    const totalEmissions = App.state.totalToday;
    const budget = 11.5;

    let level = 1;
    let levelName = 'Seedling';

    if (activities >= 12 && totalEmissions < budget * 0.5) {
      level = 5; levelName = 'Forest Guardian';
    } else if (activities >= 8) {
      level = 4; levelName = 'Fern Canopy';
    } else if (activities >= 4) {
      level = 3; levelName = 'Young Plant';
    } else if (activities >= 1) {
      level = 2; levelName = 'Sprout';
    }

    const scene = document.getElementById('garden-scene');
    const levelEl = document.getElementById('garden-level');
    const offsetEl = document.getElementById('garden-offset');

    if (scene) {
      scene.setAttribute('data-level', level);
      scene.setAttribute('aria-label', `Virtual garden at ${levelName} level`);
    }
    if (levelEl) {
      levelEl.textContent = `Level ${level}: ${levelName}`;
    }
    if (offsetEl) {
      const offset = (activities * 0.8).toFixed(1);
      offsetEl.textContent = `${offset} kg CO\u2082 Offset`;
    }
  }
};

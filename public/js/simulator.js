/**
 * @fileoverview Lifestyle What-If simulator module for CarbonSaathi AI.
 * Simulates projected lifestyle carbon savings and displays equivalents.
 * @module public/js/simulator
 */

App.Simulator = {
  /**
   * Renders the simulator scenarios and binds click listeners.
   * @returns {void}
   */
  render() {
    const btns = document.querySelectorAll('.simulator-scenario-btn');
    btns.forEach(btn => {
      btn.onclick = () => {
        btns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const scenario = btn.getAttribute('data-scenario');
        App.Simulator.runSimulation(scenario);
      };
    });
  },

  /**
   * Triggers the simulator endpoint and renders outputs.
   * @param {string} scenario - Active scenario keyword.
   * @returns {Promise<void>}
   */
  async runSimulation(scenario) {
    if (App.state.activities.length === 0) {
      App.Toast.show('Please log some activities before running the simulator.', 'error');
      return;
    }

    // Set scenario specific parameters
    let scenarioParams = {};
    switch (scenario) {
      case 'switch_transport':
        scenarioParams = { fromMode: 'scooter_petrol', toMode: 'metro' };
        break;
      case 'reduce_meat':
        scenarioParams = { reductionFactor: 0.5 };
        break;
      case 'reduce_ac':
        scenarioParams = { hoursReduced: 2 };
        break;
      case 'cycle_instead':
        scenarioParams = { maxDistance: 5 };
        break;
      default:
        break;
    }

    try {
      const response = await fetch('/api/simulator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentActivities: App.state.activities,
          scenario,
          scenarioParams
        })
      });

      if (!response.ok) {
        throw new Error('Simulation failed.');
      }

      const data = await response.json();
      const r = data.result;

      // Reveal output panel
      const outputPanel = document.getElementById('simulator-output-panel');
      if (outputPanel) outputPanel.classList.remove('hidden');

      // Update values
      const cur = document.getElementById('sim-current-val');
      const prop = document.getElementById('sim-proposed-val');
      const sav = document.getElementById('sim-savings-val');

      if (cur) cur.textContent = `${r.currentKgPerMonth.toFixed(1)} kg`;
      if (prop) prop.textContent = `${r.proposedKgPerMonth.toFixed(1)} kg`;
      if (sav) sav.textContent = `${r.savedKgPerMonth.toFixed(1)} kg CO₂ / Month (-${r.percentageReduction}%)`;

      // Render equivalents comparison chips
      const chips = document.getElementById('sim-comparison-chips');
      if (chips) {
        chips.innerHTML = DOMPurify.sanitize(`
          <div class="comparison-chip" aria-label="🌳 ${r.equivalents.treesPlanted} Trees planted equivalent">
            <span>🌳 Trees:</span> <span class="chip-val">${r.equivalents.treesPlanted} planted/yr</span>
          </div>
          <div class="comparison-chip" aria-label="🚗 ${r.equivalents.kmNotDriven} Kilometers not driven">
            <span>🚗 Car travel:</span> <span class="chip-val">-${r.equivalents.kmNotDriven} km/yr</span>
          </div>
          <div class="comparison-chip" aria-label="📱 ${r.equivalents.phoneCharges} Phone charges saved">
            <span>📱 Phone charges:</span> <span class="chip-val">${r.equivalents.phoneCharges} charges/yr</span>
          </div>
          <div class="comparison-chip" aria-label="❄️ ${r.equivalents.flightHoursAvoided} Flight hours avoided">
            <span>🌍 Flight equivalent:</span> <span class="chip-val">-${r.equivalents.flightHoursAvoided} hrs/yr</span>
          </div>
        `);
      }

      App.Toast.show(`Simulation ran! Saved ${r.savedKgPerMonth.toFixed(1)} kg CO₂/month`, 'success');
    } catch (err) {
      App.Toast.show(err.message || 'Could not compute simulation.', 'error');
    }
  }
};

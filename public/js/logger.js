/**
 * @fileoverview Log activity UI handler for CarbonSaathi AI.
 * Renders activity categories, inputs values, and computes client-side comparison previews.
 * @module public/js/logger
 */

App.Logger = {
  selectedCategory: '',
  selectedType: '',
  selectedFactor: 0,
  selectedUnit: '',
  debounceTimeout: null,

  factors: {
    travel: {
      scooter_petrol: { factor: 0.092, unit: 'km', label: 'Petrol Scooter', icon: '🛵' },
      car_petrol: { factor: 0.21, unit: 'km', label: 'Petrol Car', icon: '🚗' },
      car_electric: { factor: 0.05, unit: 'km', label: 'Electric Car', icon: '⚡' },
      auto_rickshaw: { factor: 0.065, unit: 'km', label: 'Auto Rickshaw', icon: '🛺' },
      bus: { factor: 0.089, unit: 'km', label: 'Bus', icon: '🚌' },
      metro: { factor: 0.031, unit: 'km', label: 'Metro', icon: '🚇' },
      train: { factor: 0.041, unit: 'km', label: 'Train', icon: '🚂' },
      flight_domestic: { factor: 0.255, unit: 'km', label: 'Domestic Flight', icon: '✈️' },
      walking: { factor: 0.0, unit: 'km', label: 'Walking', icon: '🚶' },
      cycling: { factor: 0.0, unit: 'km', label: 'Cycling', icon: '🚲' }
    },
    food: {
      beef: { factor: 27.0, unit: 'kg', label: 'Beef', icon: '🥩' },
      mutton: { factor: 39.2, unit: 'kg', label: 'Mutton', icon: '🍖' },
      chicken: { factor: 6.9, unit: 'kg', label: 'Chicken', icon: '🍗' },
      fish: { factor: 6.1, unit: 'kg', label: 'Fish', icon: '🐟' },
      dairy: { factor: 3.2, unit: 'kg', label: 'Dairy', icon: '🥛' },
      eggs: { factor: 4.5, unit: 'kg', label: 'Eggs', icon: '🥚' },
      vegetables: { factor: 2.0, unit: 'kg', label: 'Vegetables', icon: '🥦' },
      rice: { factor: 2.7, unit: 'kg', label: 'Rice', icon: '🍚' },
      pulses: { factor: 0.9, unit: 'kg', label: 'Pulses/Dal', icon: '🫘' }
    },
    energy: {
      electricity: { factor: 0.82, unit: 'kWh', label: 'Electricity', icon: '⚡' },
      lpg_cooking: { factor: 1.51, unit: 'litres', label: 'LPG Cooking', icon: '🍳' },
      ac_usage: { factor: 1.23, unit: 'hours', label: 'Air Conditioning', icon: '❄️' }
    },
    shopping: {
      clothing: { factor: 20.0, unit: 'items', label: 'Clothing', icon: '👕' },
      electronics: { factor: 70.0, unit: 'items', label: 'Electronics', icon: '📱' },
      online_delivery: { factor: 0.5, unit: 'orders', label: 'Online Delivery', icon: '📦' }
    },
    flights: {
      domestic: { factor: 0.255, unit: 'km', label: 'Domestic Flight', icon: '✈️' },
      international: { factor: 0.195, unit: 'km', label: 'International Flight', icon: '🌍' }
    }
  },

  /**
   * Initializes the logger category view.
   * @returns {void}
   */
  init() {
    App.Logger.selectedCategory = '';
    App.Logger.selectedType = '';
    App.Logger.selectedFactor = 0;
    App.Logger.selectedUnit = '';

    // Show category selector grid, hide forms
    const grid = document.getElementById('logger-category-grid');
    const formSection = document.getElementById('logger-form-section');
    if (grid) grid.classList.remove('hidden');
    if (formSection) formSection.classList.add('hidden');

    const backBtn = document.getElementById('logger-back-btn');
    if (backBtn) {
      backBtn.onclick = () => App.Logger.init();
    }

    const submitBtn = document.getElementById('logger-submit-btn');
    if (submitBtn) {
      submitBtn.onclick = () => App.Logger.logActivity();
    }

    // Bind category buttons
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
      card.onclick = () => {
        const cat = card.getAttribute('data-category');
        App.Logger.selectCategory(cat);
      };
    });
  },

  /**
   * Prepares form display for the selected category.
   * @param {string} category - Selected category keyword.
   * @returns {void}
   */
  selectCategory(category) {
    App.Logger.selectedCategory = category;

    // Show Form panel
    const grid = document.getElementById('logger-category-grid');
    const formSection = document.getElementById('logger-form-section');
    if (grid) grid.classList.add('hidden');
    if (formSection) formSection.classList.remove('hidden');

    // Title
    const title = document.getElementById('logger-selected-cat-title');
    if (title) {
      title.textContent = `Logging: ${category.toUpperCase()}`;
    }

    // Hide input value panel until type is selected
    const inputPanel = document.getElementById('logger-value-input-panel');
    if (inputPanel) inputPanel.classList.add('hidden');

    // Render activity types
    const container = document.getElementById('logger-activity-type-selection');
    if (!container) return;

    const catData = Object.prototype.hasOwnProperty.call(App.Logger.factors, category)
      ? App.Logger.factors[category]
      : {};

    container.innerHTML = '';
    Object.entries(catData).forEach(([type, details]) => {
      const button = document.createElement('button');
      button.className = 'act-type-btn';
      button.setAttribute('data-type', type);
      button.setAttribute('data-factor', details.factor.toString());
      button.setAttribute('data-unit', details.unit);
      button.setAttribute('aria-label', `Select ${details.label}`);
      button.textContent = `${details.icon} ${details.label}`;
      container.appendChild(button);
    });

    // Attach type listeners
    const buttons = container.querySelectorAll('.act-type-btn');
    buttons.forEach(btn => {
      btn.onclick = () => {
        buttons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const type = btn.getAttribute('data-type');
        const factor = parseFloat(btn.getAttribute('data-factor'));
        const unit = btn.getAttribute('data-unit');

        App.Logger.selectActivity(type, factor, unit);
      };
    });
  },

  /**
   * Prepares value input prompts once type is locked.
   * @param {string} type - Activity type keyword.
   * @param {number} factor - Co2 conversion factor.
   * @param {string} unit - Measurement unit label.
   * @returns {void}
   */
  selectActivity(type, factor, unit) {
    App.Logger.selectedType = type;
    App.Logger.selectedFactor = factor;
    App.Logger.selectedUnit = unit;

    // Show input panel
    const inputPanel = document.getElementById('logger-value-input-panel');
    if (inputPanel) inputPanel.classList.remove('hidden');

    // Set labels
    const label = document.getElementById('logger-input-label');
    if (label) {
      label.textContent = `Enter quantity of usage:`;
      label.setAttribute('for', 'logger-value-input');
    }

    const unitSpan = document.getElementById('logger-input-unit');
    if (unitSpan) {
      unitSpan.textContent = unit;
    }

    // Clear input and previews
    const input = document.getElementById('logger-value-input');
    if (input) {
      input.value = '';
      input.oninput = () => {
        clearTimeout(App.Logger.debounceTimeout);
        App.Logger.debounceTimeout = setTimeout(() => App.Logger.updatePreview(parseFloat(input.value) || 0), 300);
      };
    }

    const previewPanel = document.getElementById('logger-preview-panel');
    if (previewPanel) previewPanel.classList.add('hidden');
  },

  /**
   * Generates instant local comparison previews for text inputs.
   * @param {number} value - Input value.
   * @returns {void}
   */
  updatePreview(value) {
    const previewPanel = document.getElementById('logger-preview-panel');
    if (!previewPanel) return;

    if (value <= 0) {
      previewPanel.classList.add('hidden');
      return;
    }

    previewPanel.classList.remove('hidden');

    const preview = value * App.Logger.selectedFactor;
    const previewVal = document.getElementById('logger-preview-val');
    if (previewVal) {
      previewVal.textContent = `${preview.toFixed(2)} kg CO₂`;
    }

    // Comparison maths
    const trees = Math.ceil(preview / 0.057);
    const km = (preview / 0.21).toFixed(1);
    const phone = Math.round(preview / 0.005);
    const ac = Math.round(preview / 0.021);

    const chipsContainer = document.getElementById('logger-comparison-chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = '';
      const createChip = (iconText, labelText, valueText, ariaText) => {
        const chip = document.createElement('div');
        chip.className = 'comparison-chip';
        chip.setAttribute('aria-label', ariaText);

        const iconSpan = document.createElement('span');
        iconSpan.textContent = iconText;

        const valSpan = document.createElement('span');
        valSpan.className = 'chip-val';
        valSpan.textContent = valueText;

        chip.appendChild(iconSpan);
        chip.appendChild(document.createTextNode(' '));
        chip.appendChild(valSpan);
        return chip;
      };

      chipsContainer.appendChild(createChip('🌳 Trees:', 'Trees', trees.toString(), `Absorbed by ${trees} trees in a day`));
      chipsContainer.appendChild(createChip('🚗 Car:', 'Car', `${km} km`, `Equal to driving a petrol car for ${km} kilometers`));
      chipsContainer.appendChild(createChip('📱 Phone:', 'Phone', phone.toString(), `Equal to charging a phone ${phone} times`));
      chipsContainer.appendChild(createChip('❄️ AC:', 'AC', `${ac} mins`, `Equal to running AC for ${ac} minutes`));
    }
  },

  /**
   * Posts finalized logged activities and triggers dashboard renders.
   * @returns {Promise<void>}
   */
  async logActivity() {
    const input = document.getElementById('logger-value-input');
    const value = parseFloat(input?.value);

    if (isNaN(value) || value <= 0) {
      App.Toast.show('Please enter a positive numeric value.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: App.Logger.selectedCategory,
          activityType: App.Logger.selectedType,
          value
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Logging error');
      }

      const result = await response.json();

      // Update state
      App.state.activities.push({
        category: result.category,
        activityType: result.activityType,
        value: result.value
      });

      App.state.totalToday = parseFloat((App.state.totalToday + result.emissions).toFixed(2));
      App.state.lastLogDate = new Date().toDateString();

      App.Storage.save();
      App.Dashboard.render();

      App.Toast.show(`Logged! +${result.emissions} kg CO₂`, 'warning');
      App.Logger.init();
    } catch (err) {
      App.Toast.show(err.message || 'Could not log activity. Connection lost.', 'error');
    }
  }
};

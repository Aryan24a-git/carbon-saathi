/**
 * @fileoverview Onboarding wizard module for CarbonSaathi AI.
 * Handles the 5-step registration process and saves profile details.
 * @module public/js/onboarding
 */

App.Onboarding = {
  currentStep: 0,
  answers: {
    commute: '',
    diet: '',
    acUsage: '',
    recycling: false,
    onlineShopping: ''
  },

  questions: [
    {
      key: 'commute',
      text: 'How do you usually commute?',
      options: [
        { label: '🛵 Scooter', value: 'scooter' },
        { label: '🚌 Bus', value: 'bus' },
        { label: '🚇 Metro', value: 'metro' },
        { label: '🚗 Car', value: 'car' },
        { label: '🚶 Walking', value: 'walking' },
        { label: '🚲 Cycling', value: 'cycling' }
      ]
    },
    {
      key: 'diet',
      text: 'What best describes your diet?',
      options: [
        { label: '🥗 Vegan', value: 'vegan' },
        { label: '🥦 Vegetarian', value: 'vegetarian' },
        { label: '🍗 Non-veg (weekly)', value: 'nonveg_weekly' },
        { label: '🥩 Non-veg (daily)', value: 'nonveg_daily' }
      ]
    },
    {
      key: 'acUsage',
      text: 'How often do you use AC?',
      options: [
        { label: 'Never', value: 'never' },
        { label: 'Sometimes', value: 'sometimes' },
        { label: 'Often', value: 'often' },
        { label: 'Always', value: 'always' }
      ]
    },
    {
      key: 'recycling',
      text: 'Do you recycle / segregate waste?',
      options: [
        { label: '✅ Yes', value: true },
        { label: '❌ No', value: false },
        { label: '🤷 Sometimes', value: false }
      ]
    },
    {
      key: 'onlineShopping',
      text: 'How often do you shop online?',
      options: [
        { label: '📦 Rarely', value: 'rarely' },
        { label: '📦📦 Weekly', value: 'weekly' },
        { label: '📦📦📦 Daily', value: 'daily' }
      ]
    }
  ],

  /**
   * Initializes the onboarding wizard layout.
   * @returns {void}
   */
  init() {
    App.Onboarding.currentStep = 0;
    App.Onboarding.renderStep();
  },

  /**
   * Renders the current active step and updates progress indicators.
   * @returns {void}
   */
  renderStep() {
    const container = document.getElementById('onboarding-questions-container');
    if (!container) return;

    const currentQuestion = App.Onboarding.questions[App.Onboarding.currentStep];
    const totalSteps = App.Onboarding.questions.length;
    const progressPercent = ((App.Onboarding.currentStep + 1) / totalSteps) * 100;

    // Update progress bar & dots
    const progressIndicator = document.getElementById('onboarding-progress-indicator');
    if (progressIndicator) {
      progressIndicator.style.width = `${progressPercent}%`;
      progressIndicator.setAttribute('aria-valuenow', progressPercent);
    }

    const dots = document.querySelectorAll('#onboarding-dots .dot');
    dots.forEach((dot, idx) => {
      if (idx === App.Onboarding.currentStep) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Generate HTML for step
    container.innerHTML = DOMPurify.sanitize(`
      <div class="question-block">
        <h4 class="question-text">${currentQuestion.text}</h4>
        <div class="options-list">
          ${currentQuestion.options.map(opt => `
            <button class="option-btn" data-value="${opt.value}" aria-label="Select ${opt.label}">
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </div>
    `);

    // Attach option listeners
    const buttons = container.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        let value = btn.getAttribute('data-value');

        // Convert string booleans back to primitives if necessary
        if (value === 'true') value = true;
        if (value === 'false') value = false;

        App.Onboarding.answers[currentQuestion.key] = value;
        App.Onboarding.nextStep();
      });
    });
  },

  /**
   * Advances the wizard or submits results if complete.
   * @returns {void}
   */
  nextStep() {
    if (App.Onboarding.currentStep < App.Onboarding.questions.length - 1) {
      App.Onboarding.currentStep++;
      App.Onboarding.renderStep();
    } else {
      App.Onboarding.submit();
    }
  },

  /**
   * Submits onboarding payload to server and synchronizes application state.
   * @returns {Promise<void>}
   */
  async submit() {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(App.Onboarding.answers)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Onboarding failed');
      }

      const result = await response.json();

      // Update state
      App.state.profile = result.profile;
      App.state.lastLogDate = new Date().toDateString();
      App.state.streak = 1;

      App.Storage.save();
      App.showNav();

      // Show welcome message
      App.Toast.show(`Baseline Score: ${result.baselineKgPerDay} kg CO₂/day! ${result.personalizedTip}`, 'success');

      // Go to dashboard
      App.showPage('dashboard');
    } catch (err) {
      App.Toast.show(err.message || 'Connection lost, please try again.', 'error');
    }
  }
};

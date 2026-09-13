/**
 * Section 7: Contact / Footer
 * Industrial blueprint form, dynamic GFA range slider, crane hoist animation, and requisition dispatch feedback
 */

export function initContact() {
  const form = document.getElementById('construction-form');
  const scaleSlider = document.getElementById('project-scale');
  const scaleReadout = document.getElementById('scale-readout');
  const feedbackEl = document.getElementById('form-feedback');
  const submitBtn = document.getElementById('submit-blueprint-btn');
  const magneticSlot = document.getElementById('cta-magnetic-slot');

  // GFA Slider live readout
  if (scaleSlider && scaleReadout) {
    scaleSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      scaleReadout.textContent = `${val.toLocaleString()} m²`;
    });
  }

  // Magnetic slot click / drop trigger
  if (magneticSlot && submitBtn) {
    magneticSlot.addEventListener('click', () => {
      submitBtn.click();
    });
  }

  // Form submission handler
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="btn-content">
            <span class="pulse-dot"></span>
            <span class="btn-text">ENCRYPTING & TRANSMITTING REQUISITION...</span>
          </span>
        `;
      }

      // Simulate technical transmission
      setTimeout(() => {
        if (feedbackEl) {
          feedbackEl.classList.add('is-visible');
        }

        if (submitBtn) {
          submitBtn.innerHTML = `
            <span class="btn-content">
              <span>✓</span>
              <span class="btn-text">REQUISITION TRANSMITTED // REF: #EC-9812</span>
            </span>
          `;
          submitBtn.style.background = '#2B2A28';
          submitBtn.style.color = '#EDE9E3';
        }

        // Animate vector crane trolley in left column
        const trolley = document.getElementById('svg-trolley');
        const hoistCable = document.getElementById('svg-hoist-cable');
        const hoistLoad = document.getElementById('svg-hoist-load');

        if (trolley && hoistCable && hoistLoad) {
          trolley.setAttribute('x', '160');
          hoistCable.setAttribute('x1', '168');
          hoistCable.setAttribute('x2', '168');
          hoistCable.setAttribute('y2', '140');
          hoistLoad.setAttribute('transform', 'translate(140, 140)');
          trolley.style.transition = 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
          hoistCable.style.transition = 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
          hoistLoad.style.transition = 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
        }
      }, 900);
    });
  }
}

"use strict";
(function () {
    const ns = globalThis.YTLayoutCustomizer;
    function closeDialog(dialog) {
        if (dialog.parentNode) {
            dialog.remove();
        }
    }
    function getBaseFormHtml(config) {
        return `
        <h3 class="ytc-heading">
          <span class="ytc-heading-icon">📺</span>
          <span>YT Layout Controls</span>
        </h3>

        <div class="ytc-field">
          <label class="ytc-inline-label">
            <input type="checkbox" id="input-adaptive" ${config.mode === 'adaptive' ? 'checked' : ''} />
            <span>Adaptive layout (Automatically adjusts based on window size)</span>
          </label>
        </div>

        <div class="ytc-field">
          <label class="ytc-label">Adaptive Breakpoints (JSON):</label>
          <textarea
            id="input-breakpoints"
            rows="8"
            class="ytc-textarea"
          >${ns.escapeHtml(ns.serializeBreakpoints(config.adaptiveBreakpoints))}</textarea>
        </div>
      `;
    }
    function getWatchPageFieldsHtml(config) {
        return `
        <div class="ytc-field">
          <label class="ytc-label">Sidebar Width:</label>
          <input
            type="text"
            id="input-sidebar"
            value="${config.sidebarWidth}"
            class="ytc-input"
          />
        </div>
      `;
    }
    function getBrowsePageFieldsHtml(config) {
        return `
        <div class="ytc-field">
          <label class="ytc-label">Standard Videos Per Row (manual mode):</label>
          <input
            type="number"
            min="1"
            max="12"
            id="input-videos"
            value="${config.videosPerRow}"
            class="ytc-input"
          />
        </div>

        <div class="ytc-field">
          <label class="ytc-label">Shorts Per Row (manual mode):</label>
          <input
            type="number"
            min="1"
            max="12"
            id="input-shorts"
            value="${config.shortsPerRow}"
            class="ytc-input"
          />
        </div>
      `;
    }
    function getFooterHtml() {
        return `
        <div class="ytc-footer">
          <button id="btn-reset" class="ytc-btn ytc-btn-reset">Reset</button>
          <div class="ytc-btn-group">
            <button id="btn-cancel" class="ytc-btn">Cancel</button>
            <button id="btn-save" class="ytc-btn ytc-btn-primary">Apply Changes</button>
          </div>
        </div>
      `;
    }
    function buildDialogHtml(config, isWatchPage) {
        const pageFields = isWatchPage
            ? getWatchPageFieldsHtml(config)
            : getBrowsePageFieldsHtml(config);
        return getBaseFormHtml(config) + pageFields + getFooterHtml();
    }
    function getDialogControls(dialog) {
        return {
            adaptiveCheckbox: dialog.querySelector('#input-adaptive'),
            breakpointsInput: dialog.querySelector('#input-breakpoints'),
            sidebarInput: dialog.querySelector('#input-sidebar'),
            videosInput: dialog.querySelector('#input-videos'),
            shortsInput: dialog.querySelector('#input-shorts')
        };
    }
    function applyModeAndBreakpoints(nextConfig, controls) {
        nextConfig.mode = controls.adaptiveCheckbox?.checked ? 'adaptive' : 'manual';
        if (!controls.breakpointsInput) {
            return null;
        }
        try {
            nextConfig.adaptiveBreakpoints = ns.parseBreakpoints(controls.breakpointsInput.value);
            return null;
        }
        catch (error) {
            return `Invalid breakpoint JSON: ${error.message}`;
        }
    }
    function applyWatchPageConfig(nextConfig, controls) {
        if (!controls.sidebarInput) {
            return;
        }
        nextConfig.sidebarWidth = controls.sidebarInput.value || ns.DEFAULT_CONFIG.sidebarWidth;
    }
    function applyBrowsePageConfig(nextConfig, controls) {
        if (controls.videosInput) {
            const vVal = Number.parseInt(controls.videosInput.value, 10);
            if (!Number.isNaN(vVal) && vVal > 0) {
                nextConfig.videosPerRow = vVal;
            }
        }
        if (controls.shortsInput) {
            const sVal = Number.parseInt(controls.shortsInput.value, 10);
            if (!Number.isNaN(sVal) && sVal > 0) {
                nextConfig.shortsPerRow = sVal;
            }
        }
    }
    function buildNextConfig(baseConfig, controls, isWatchPage) {
        const nextConfig = { ...baseConfig };
        const breakpointError = applyModeAndBreakpoints(nextConfig, controls);
        if (breakpointError) {
            alert(breakpointError);
            return null;
        }
        if (isWatchPage) {
            applyWatchPageConfig(nextConfig, controls);
        }
        else {
            applyBrowsePageConfig(nextConfig, controls);
        }
        return nextConfig;
    }
    function saveAndApplyConfig(nextConfig, dialog) {
        ns.saveConfig(nextConfig).then(() => {
            ns.applyLayout(nextConfig);
            closeDialog(dialog);
        });
    }
    function createSubmitHandler(config, controls, isWatchPage, dialog) {
        return () => {
            const nextConfig = buildNextConfig(config, controls, isWatchPage);
            if (!nextConfig) {
                return;
            }
            saveAndApplyConfig(nextConfig, dialog);
        };
    }
    function attachDialogHandlers(dialog, config, controls, isWatchPage) {
        const submit = createSubmitHandler(config, controls, isWatchPage, dialog);
        dialog
            .querySelectorAll('input, textarea')
            .forEach((input) => {
            ns.addInputEnterKeyHandler(input, submit);
        });
        dialog
            .querySelector('#btn-cancel')
            ?.addEventListener('click', () => closeDialog(dialog));
        dialog.querySelector('#btn-reset')?.addEventListener('click', () => {
            closeDialog(dialog);
            ns.resetSettings();
        });
        dialog.querySelector('#btn-save')?.addEventListener('click', submit);
    }
    function removeExistingDialog() {
        const existing = document.getElementById('yt-customizer-dialog');
        if (existing) {
            existing.remove();
        }
    }
    function createDialog(config, isWatchPage) {
        const dialog = document.createElement('div');
        dialog.id = 'yt-customizer-dialog';
        dialog.innerHTML = buildDialogHtml(config, isWatchPage);
        document.body.appendChild(dialog);
        return dialog;
    }
    function showOptionsDialog() {
        ns.loadConfig().then((config) => {
            const isWatchPage = globalThis.location.pathname.includes('/watch');
            removeExistingDialog();
            const dialog = createDialog(config, isWatchPage);
            const controls = getDialogControls(dialog);
            attachDialogHandlers(dialog, config, controls, isWatchPage);
        });
    }
    Object.assign(ns, { showOptionsDialog, closeDialog });
})();

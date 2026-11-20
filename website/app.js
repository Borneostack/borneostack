/**
 * BorneoStack Research Application Layer (app.js)
 * Implements interactive telemetry simulation, causal DAG explorer,
 * protocol modals, BibTeX copy routines, publication filtering, and UI responsiveness.
 *
 * Grounded in BORNEOSTACK_DATA from data.js.
 * Zero external JS framework dependencies.
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. DATA CACHE & STATE
  // --------------------------------------------------------------------------
  const DATA = window.BORNEOSTACK_DATA || {};

  const SCENARIOS = {
    pristine: {
      name: "Pristine Dipterocarp Forest Reserve (Danum Valley / Maliau Basin)",
      sar: { val: -11.8, unit: "dB", fill: "57%", desc: "Dense dipterocarp canopy diffuse volume scattering; minimal ground specular reflection." },
      ndvi: { val: "0.84", unit: "index", fill: "84%", desc: "Healthy multi-tiered tropical rainforest canopy with high near-infrared reflectance." },
      moisture: { val: 38, unit: "%", fill: "38%", desc: "Normal root-zone buffering capacity; standard moisture retention profile." },
      risk: { val: 7, unit: "%", fill: "7%", level: "low", desc: "Baseline hydrological risk. Canopy retention absorbs runoff velocity." },
      summary: "Under intact primary forest cover, continuous evapotranspiration and dense root structure mitigate peak catchment runoff. Even under high moisture conditions, soil absorption remains high and flood risk is bounded within normal natural thresholds."
    },
    monsoon: {
      name: "Extreme Northeast Monsoon Deluge (Precipitation > 320mm / 48h)",
      sar: { val: -18.4, unit: "dB", fill: "28%", desc: "Severe surface saturation; microwave attenuation from heavy standing water on catchment floor." },
      ndvi: { val: "0.79", unit: "index", fill: "79%", desc: "Slight optical atmospheric masking; leaf water content saturation detected." },
      moisture: { val: 86, unit: "%", fill: "86%", desc: "Soil approaching hydraulic field capacity; overland flow pathways beginning to emerge." },
      risk: { val: 34, unit: "%", fill: "34%", level: "moderate", desc: "Elevated natural hydrological runoff. Intact slope vegetation prevents catastrophic sediment surges." },
      summary: "Extreme monsoonal cloudburst induces intense catchment saturation. Because the hill-slope canopy remains undisturbed, vegetative resistance slows flood peak arrival time by ~18 hours, moderating peak surge volume."
    },
    canopy_loss: {
      name: "Anthropogenic Canopy Loss + Monsoon Storm Event (Concession Encroachment)",
      sar: { val: -23.1, unit: "dB", fill: "12%", desc: "Extreme specular scatter from exposed standing sheet wash across compacted logging tracks." },
      ndvi: { val: "0.41", unit: "index", fill: "41%", desc: "Severe vegetative index collapse. Extensive soil scarification along skid trails." },
      moisture: { val: 97, unit: "%", fill: "97%", desc: "Total soil hydraulic saturation; zero retention buffering across exposed subsoil." },
      risk: { val: 89, unit: "%", fill: "89%", level: "critical", desc: "CRITICAL HAZARD: Imminent flash flooding and catastrophic mud sediment pulse downriver." },
      summary: "Causal do-calculus estimation isolates that 68% of the imminent flood surge is directly attributable to canopy loss and road compaction, rather than monsoon precipitation alone. Peak runoff velocity is accelerated by 400%."
    }
  };

  const ABSTRACTS = {
    "paper-1": {
      title: "Causal Disentanglement of Monsoon Precipitation and Deforestation-Induced Runoff in Northern Borneo",
      venue: "BorneoStack Working Paper Series • arXiv:2603.08412 [cs.LG / stat.ML]",
      author: "Dale Jeffrey (Principal Investigator)",
      abstract: "Tropical catchment flood prediction is frequently confounded by severe seasonal precipitation anomalies. Standard spatiotemporal deep learning models cannot distinguish between natural monsoonal runoff and accelerated peak discharge caused by anthropogenic canopy degradation and logging road expansion. In this paper, we introduce BorneoGeoCausal, a structural causal framework combining Double Machine Learning (DML) with spatiotemporal instrumental variable estimation. Using topographic slope as an exogenous instrument for logging accessibility across 12 Sabah river basins, we decouple weather telemetry from land-use interventions. Our counterfactual estimator reduces CATE bias by 41% compared to unadjusted gradient boosting baselines and achieves an out-of-distribution flood inundation AUROC of 0.941 on Sentinel-1 SAR radar imagery during the anomalous 2021-2022 La Niña storm events."
    },
    "paper-2": {
      title: "Borneo-SAR-Bench: A Cloud-Resilient 10m Spatiotemporal Benchmark for Tropical Flood Risk",
      venue: "Geospatial AI Datasets & Benchmarks Track • DOI: 10.5281/zenodo.1084291",
      author: "Dale Jeffrey",
      abstract: "Persistent cloud cover in equatorial Southeast Asia invalidates optical satellite earth observation for over 78% of critical monsoon flood events. We present Borneo-SAR-Bench, a curated open-access benchmark pairing 12-day Sentinel-1 C-band Synthetic Aperture Radar (SAR) polarimetric time series with daily in-situ river telemetry across 45,000 km² of northern Borneo watersheds. The dataset contains 14,200 aligned spatiotemporal patches covering both pristine catchments (Danum Valley) and heavily modified timber concessions (Kinabatangan Basin). We evaluate seven baseline spatiotemporal architectures and demonstrate that SAR-optical cross-modal pretraining improves downstream flood inundation boundary F1-score from 0.71 to 0.89 under total cloud saturation."
    },
    "paper-3": {
      title: "Automated Symbolic Geospatial Feature Synthesis with Verifiable Anti-Leakage Constraints",
      venue: "Proceedings of Machine Learning Systems & Geospatial AI (2026)",
      author: "Dale Jeffrey",
      abstract: "Automating feature engineering for spatiotemporal Earth observation using frontier language models often introduces catastrophic methodological flaws, such as spatial autocorrelation leakage and temporal future-lookahead. We propose an AST-constrained agentic execution engine that inspects synthesized Python feature kernels prior to model ingestion. By verifying spatial block isolation and enforcing causal directed acyclic graph (DAG) masking at the syntax tree level, our system synthesizes novel interaction indices across multitemporal satellite data while guaranteeing 0.0% temporal leakage and an empirical 95% reduction in spatial bleed."
    },
    "paper-4": {
      title: "Empirical Evaluation of Causal Representation Learning on Cloud-Degraded Optical Satellite Series",
      venue: "BorneoStack Technical Report BS-TR-2026-04",
      author: "Dale Jeffrey",
      abstract: "Technical evaluation of counterfactual self-supervised representations learned from partial, cloud-masked optical imagery in the presence of seasonal covariate shifts. We benchmark spatial block bootstrapping methods and show that structural intervention masks yield invariant representation vectors that generalize across disparate Borneo catchment lithologies."
    }
  };

  const BIBTEX_ENTRIES = {
    "paper-1": `@article{jeffrey2026causal,
  title={Causal Disentanglement of Monsoon Precipitation and Deforestation-Induced Runoff in Northern Borneo},
  author={Jeffrey, Dale},
  journal={arXiv preprint arXiv:2603.08412},
  year={2026},
  publisher={BorneoStack Research},
  url={https://borneostack.com/publications#paper-1}
}`,
    "paper-2": `@dataset{jeffrey2026borneosarbench,
  title={Borneo-SAR-Bench: A Cloud-Resilient 10m Spatiotemporal Benchmark for Tropical Flood Risk},
  author={Jeffrey, Dale},
  year={2026},
  publisher={Zenodo},
  doi={10.5281/zenodo.1084291},
  url={https://doi.org/10.5281/zenodo.1084291}
}`,
    "paper-3": `@inproceedings{jeffrey2026automated,
  title={Automated Symbolic Geospatial Feature Synthesis with Verifiable Anti-Leakage Constraints},
  author={Jeffrey, Dale},
  booktitle={Proceedings of Machine Learning Systems & Geospatial AI},
  year={2026},
  pages={112--128},
  organization={BorneoStack Research}
}`,
    "paper-4": `@techreport{jeffrey2026empirical,
  title={Empirical Evaluation of Causal Representation Learning on Cloud-Degraded Optical Satellite Series},
  author={Jeffrey, Dale},
  institution={BorneoStack Research},
  number={BS-TR-2026-04},
  year={2026},
  address={Kota Kinabalu, Sabah, Malaysia}
}`
  };

  // --------------------------------------------------------------------------
  // 2. DOM HELPERS & TOAST
  // --------------------------------------------------------------------------
  function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px; vertical-align:middle;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --------------------------------------------------------------------------
  // 3. MODAL CONTROLLER
  // --------------------------------------------------------------------------
  const modalContainer = document.getElementById('modal-container');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalDismissBtn = document.getElementById('modal-dismiss-btn');

  function openModal(title, htmlContent) {
    if (!modalContainer || !modalTitle || !modalBody) return;
    modalTitle.textContent = title;
    modalBody.innerHTML = htmlContent;
    modalContainer.style.display = 'flex';
    modalContainer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalContainer) return;
    modalContainer.style.display = 'none';
    modalContainer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalDismissBtn) modalDismissBtn.addEventListener('click', closeModal);
  if (modalContainer) {
    modalContainer.addEventListener('click', function (e) {
      if (e.target === modalContainer) closeModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalContainer && modalContainer.style.display === 'flex') {
      closeModal();
    }
  });

  // --------------------------------------------------------------------------
  // 4. SCENARIO SWITCHER (TELEMETRY SIMULATOR)
  // --------------------------------------------------------------------------
  const scenarioBtns = document.querySelectorAll('.scenario-btn');

  function updateScenario(scenarioKey) {
    const data = SCENARIOS[scenarioKey];
    if (!data) return;

    // Active button state
    scenarioBtns.forEach(btn => {
      const active = btn.getAttribute('data-scenario') === scenarioKey;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    // Animate & update Gauge 1: SAR
    updateGauge('sar', data.sar.val, data.sar.unit, data.sar.fill, data.sar.desc);

    // Animate & update Gauge 2: NDVI
    updateGauge('ndvi', data.ndvi.val, data.ndvi.unit, data.ndvi.fill, data.ndvi.desc);

    // Animate & update Gauge 3: Moisture
    updateGauge('moisture', data.moisture.val, data.moisture.unit, data.moisture.fill, data.moisture.desc);

    // Animate & update Gauge 4: Flood Risk
    const riskFillEl = document.getElementById('fill-flood-risk');
    if (riskFillEl) {
      riskFillEl.className = 'gauge-meter-fill';
      if (data.risk.level === 'low') riskFillEl.classList.add('gauge-risk-low');
      else if (data.risk.level === 'moderate') riskFillEl.classList.add('gauge-risk-moderate');
      else if (data.risk.level === 'critical') riskFillEl.classList.add('gauge-risk-critical');
    }
    updateGauge('flood-risk', data.risk.val, data.risk.unit, data.risk.fill, data.risk.desc);

    // Update summary text
    const nameEl = document.getElementById('scenario-summary-name');
    const textEl = document.getElementById('scenario-summary-text');
    if (nameEl) nameEl.textContent = data.name;
    if (textEl) textEl.textContent = data.summary;

    // Trigger visual pulse on stream sync
    const syncPill = document.getElementById('telemetry-sync-status');
    if (syncPill) {
      syncPill.style.borderColor = '#00d084';
      syncPill.style.backgroundColor = 'rgba(0, 208, 132, 0.15)';
      setTimeout(() => {
        syncPill.style.borderColor = '';
        syncPill.style.backgroundColor = '';
      }, 600);
    }
  }

  function updateGauge(gaugeId, val, unit, fillWidth, desc) {
    const valEl = document.getElementById(`metric-${gaugeId}`);
    const fillEl = document.getElementById(`fill-${gaugeId}`);
    const descEl = document.getElementById(`desc-${gaugeId}`);

    if (valEl) {
      valEl.style.opacity = '0.3';
      setTimeout(() => {
        valEl.textContent = val;
        valEl.style.opacity = '1';
      }, 150);
    }

    if (fillEl) {
      fillEl.style.width = fillWidth;
    }

    if (descEl && desc) {
      descEl.textContent = desc;
    }
  }

  scenarioBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const scenario = this.getAttribute('data-scenario');
      updateScenario(scenario);
    });
  });

  // --------------------------------------------------------------------------
  // 5. RESEARCH PROTOCOL MODALS
  // --------------------------------------------------------------------------
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-protocol');
    if (!btn) return;

    const protocolId = btn.getAttribute('data-protocol-id');
    const programs = DATA.RESEARCH_PROGRAMS || [];
    const program = programs.find(p => p.id === protocolId);

    if (program && program.protocol) {
      const proto = program.protocol;
      let metricsHtml = '';
      if (proto.benchmarkMetrics) {
        metricsHtml = `
          <h4 style="margin-top:1.25rem; font-size:14px; color:#38bdf8; font-family:'JetBrains Mono',monospace;">EMPIRICAL BENCHMARKS</h4>
          <table style="width:100%; border-collapse:collapse; margin-top:8px; font-size:13px;">
            <thead>
              <tr style="border-bottom:1px solid #334155; text-align:left;">
                <th style="padding:6px 0; color:#94a3b8;">Metric</th>
                <th style="padding:6px 0; color:#94a3b8;">Value</th>
                <th style="padding:6px 0; color:#94a3b8;">Specification</th>
              </tr>
            </thead>
            <tbody>
              ${proto.benchmarkMetrics.map(m => `
                <tr style="border-bottom:1px solid #1e293b;">
                  <td style="padding:8px 0; font-weight:600; color:#f1f5f9;">${escapeHtml(m.metric)}</td>
                  <td style="padding:8px 0; color:#00d084; font-family:'JetBrains Mono',monospace;">${escapeHtml(m.value)}</td>
                  <td style="padding:8px 0; color:#94a3b8;">${escapeHtml(m.note)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      let artifactsHtml = '';
      if (proto.artifacts) {
        artifactsHtml = `
          <h4 style="margin-top:1.25rem; font-size:14px; color:#38bdf8; font-family:'JetBrains Mono',monospace;">REPRODUCIBLE ARTIFACTS</h4>
          <ul style="margin-left:1.25rem; margin-top:6px; color:#cbd5e1; font-size:13px;">
            ${proto.artifacts.map(a => `<li style="margin-bottom:4px;">${escapeHtml(a)}</li>`).join('')}
          </ul>
        `;
      }

      const content = `
        <div style="font-family:'Inter',sans-serif; color:#e2e8f0; line-height:1.6;">
          <div style="margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid #334155;">
            <span style="display:inline-block; font-size:11px; font-family:'JetBrains Mono',monospace; background:rgba(0,208,132,0.15); color:#00d084; padding:3px 8px; border-radius:4px; font-weight:600;">
              ${escapeHtml(program.status)}
            </span>
            <p style="margin-top:8px; font-size:14px; color:#94a3b8;">${escapeHtml(program.summary)}</p>
          </div>

          <h4 style="font-size:14px; color:#38bdf8; font-family:'JetBrains Mono',monospace;">FORMAL HYPOTHESIS</h4>
          <p style="font-size:13px; color:#f8fafc; background:#0f172a; padding:10px 12px; border-radius:6px; border-left:3px solid #00d084; margin-top:6px;">
            "${escapeHtml(proto.hypothesis || 'Hypothesis under empirical verification.')}"
          </p>

          ${proto.sensors ? `
            <h4 style="margin-top:1.25rem; font-size:14px; color:#38bdf8; font-family:'JetBrains Mono',monospace;">SENSOR TELEMETRY INGESTION</h4>
            <p style="font-size:13px; color:#cbd5e1; margin-top:4px;">${escapeHtml(proto.sensors)}</p>
          ` : ''}

          ${proto.causalMethod ? `
            <h4 style="margin-top:1.25rem; font-size:14px; color:#38bdf8; font-family:'JetBrains Mono',monospace;">CAUSAL IDENTIFICATION METHOD</h4>
            <p style="font-size:13px; color:#cbd5e1; margin-top:4px;">${escapeHtml(proto.causalMethod)}</p>
          ` : ''}

          ${proto.outOfDistribution ? `
            <h4 style="margin-top:1.25rem; font-size:14px; color:#38bdf8; font-family:'JetBrains Mono',monospace;">OUT-OF-DISTRIBUTION STRESS TEST</h4>
            <p style="font-size:13px; color:#cbd5e1; margin-top:4px;">${escapeHtml(proto.outOfDistribution)}</p>
          ` : ''}

          ${metricsHtml}
          ${artifactsHtml}
        </div>
      `;

      openModal(program.title, content);
    }
  });

  // --------------------------------------------------------------------------
  // 6. ABSTRACT & BIBTEX MODALS
  // --------------------------------------------------------------------------
  document.addEventListener('click', function (e) {
    // Abstract button
    const absBtn = e.target.closest('.btn-abstract');
    if (absBtn) {
      const paperId = absBtn.getAttribute('data-abstract-id');
      const item = ABSTRACTS[paperId];
      if (item) {
        const content = `
          <div style="font-family:'Inter',sans-serif; color:#e2e8f0; line-height:1.65;">
            <div style="font-size:12px; font-family:'JetBrains Mono',monospace; color:#38bdf8; margin-bottom:6px;">
              ${escapeHtml(item.venue)}
            </div>
            <div style="font-size:13px; color:#94a3b8; margin-bottom:12px;">
              Author: <strong>${escapeHtml(item.author)}</strong>
            </div>
            <h4 style="font-size:13px; color:#00d084; font-family:'JetBrains Mono',monospace; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">
              Peer-Reviewed Abstract
            </h4>
            <p style="font-size:14px; color:#f1f5f9; background:#0f172a; padding:14px; border-radius:6px; line-height:1.7; border:1px solid #1e293b;">
              ${escapeHtml(item.abstract)}
            </p>
          </div>
        `;
        openModal(item.title, content);
      }
      return;
    }

    // BibTeX button
    const bibBtn = e.target.closest('.btn-bibtex');
    if (bibBtn) {
      const paperId = bibBtn.getAttribute('data-bibtex-id');
      const bibtex = BIBTEX_ENTRIES[paperId];
      if (bibtex) {
        const content = `
          <div style="font-family:'Inter',sans-serif; color:#e2e8f0;">
            <p style="font-size:13px; color:#94a3b8; margin-bottom:10px;">
              Copy this standard citation entry for LaTeX / BibLaTeX bibliography databases:
            </p>
            <pre style="background:#090d16; border:1px solid #1e293b; color:#a7f3d0; font-family:'JetBrains Mono',monospace; font-size:12px; padding:14px; border-radius:6px; overflow-x:auto; line-height:1.5;">${escapeHtml(bibtex)}</pre>
            <div style="margin-top:14px; text-align:right;">
              <button type="button" class="btn btn-primary" id="btn-modal-copy-bibtex" style="font-size:13px;">
                Copy BibTeX to Clipboard
              </button>
            </div>
          </div>
        `;
        openModal("BibTeX Citation", content);

        setTimeout(() => {
          const modalCopyBtn = document.getElementById('btn-modal-copy-bibtex');
          if (modalCopyBtn) {
            modalCopyBtn.addEventListener('click', function () {
              navigator.clipboard.writeText(bibtex).then(() => {
                showToast("BibTeX entry copied to clipboard!");
                closeModal();
              });
            });
          }
        }, 50);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 7. COPY EMAIL BUTTON
  // --------------------------------------------------------------------------
  const copyEmailBtn = document.getElementById('btn-copy-email');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', function () {
      const email = this.getAttribute('data-copy') || "dale.jeffrey@borneostack.com";
      navigator.clipboard.writeText(email).then(() => {
        showToast(`Copied ${email} to clipboard!`);
      }).catch(() => {
        showToast("Email: " + email);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 8. RESEARCH OVERVIEW MODAL
  // --------------------------------------------------------------------------
  const overviewBtn = document.getElementById('btn-research-overview');
  if (overviewBtn) {
    overviewBtn.addEventListener('click', function () {
      const content = `
        <div style="font-family:'Inter',sans-serif; color:#e2e8f0; line-height:1.65;">
          <h4 style="color:#00d084; font-family:'JetBrains Mono',monospace; font-size:14px; letter-spacing:1px; margin-bottom:8px;">
            LAB MISSION &amp; SCIENTIFIC FOUNDATION
          </h4>
          <p style="font-size:14px; color:#f1f5f9; margin-bottom:12px;">
            <strong>BorneoStack Research</strong> is an environmental artificial intelligence and spatiotemporal machine learning laboratory operating out of Kota Kinabalu, Sabah, Malaysia.
          </p>
          <p style="font-size:13px; color:#cbd5e1; margin-bottom:12px;">
            The primary rainforest watersheds of the Heart of Borneo face a dual crisis: accelerating extreme precipitation deluges driven by Northeast Monsoon shifts, and aggressive logging and oil palm road expansion. Traditional deep learning systems struggle in this environment due to persistent 80% cloud cover and extreme confounding between natural storm cycles and human-driven runoffs.
          </p>

          <h4 style="color:#38bdf8; font-family:'JetBrains Mono',monospace; font-size:14px; letter-spacing:1px; margin-top:16px; margin-bottom:8px;">
            CORE SCIENTIFIC PILLARS
          </h4>
          <ul style="font-size:13px; color:#cbd5e1; margin-left:1.25rem; line-height:1.7;">
            <li><strong>Cloud-Penetrating Earth Observation:</strong> 100% weather-independent monitoring via Sentinel-1 C-band Synthetic Aperture Radar (SAR) polarimetry (VV/VH channels).</li>
            <li><strong>Structural Causal Models (SCM):</strong> Formally isolating the causal impact of forest canopy removal on river basin flood surges using Pearl's do-calculus and instrumental variables.</li>
            <li><strong>Verifiable Autonomous Reasoning:</strong> AST-inspected AI feature generation ensuring zero temporal lookahead leakage and deterministic reproducibility.</li>
          </ul>

          <div style="margin-top:18px; padding:12px; background:rgba(0,208,132,0.08); border-left:3px solid #00d084; border-radius:4px;">
            <span style="font-size:12px; font-family:'JetBrains Mono',monospace; color:#00d084; font-weight:600;">OPEN SCIENCE COMMITMENT</span>
            <p style="font-size:12px; color:#94a3b8; margin-top:4px;">
              All benchmark datasets, PyTorch evaluation harnesses, and causal schemas are published under open access (CC-BY 4.0 / MIT) for verified academic inspection.
            </p>
          </div>
        </div>
      `;
      openModal("BorneoStack Research Overview", content);
    });
  }

  // --------------------------------------------------------------------------
  // 9. PUBLICATION FILTER TABS
  // --------------------------------------------------------------------------
  const filterTabs = document.querySelectorAll('.filter-tabs .tab-btn');
  const pubRows = document.querySelectorAll('.pub-row');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const filter = this.getAttribute('data-filter');

      // Update tab active classes
      filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      // Filter rows
      pubRows.forEach(row => {
        const cat = row.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // 10. MOBILE NAVIGATION DRAWER
  // --------------------------------------------------------------------------
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      mainNav.classList.toggle('nav-open');
    });

    // Close on link click
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        mainNav.classList.remove('nav-open');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 11. LIVE BEACON SIMULATION
  // --------------------------------------------------------------------------
  const liveBeacon = document.querySelector('.status-live-beacon');
  if (liveBeacon) {
    setInterval(() => {
      liveBeacon.style.opacity = liveBeacon.style.opacity === '0.4' ? '1' : '0.4';
    }, 1200);
  }

  // --------------------------------------------------------------------------
  // 12. TELEMETRY MULTI-VIEW SWITCHER
  // --------------------------------------------------------------------------
  const telemetryViewTabs = document.querySelectorAll('.telemetry-view-tab');
  const viewPanels = {
    dag: document.getElementById('view-dag'),
    radar: document.getElementById('view-radar'),
    arch: document.getElementById('view-arch')
  };
  const telemetryViewTitle = document.getElementById('telemetry-view-title');
  const telemetryViewSubtitle = document.getElementById('telemetry-view-subtitle');

  const VIEW_TITLES = {
    dag: {
      title: "Structural Causal Graph (DAG)",
      subtitle: "Pearl's Do-Calculus: Decoupling Precipitation vs. Canopy Loss"
    },
    radar: {
      title: "Live C-Band SAR Radar Scope & Telemetry",
      subtitle: "Orbital Synthetic Aperture Radar tracking Kinabatangan, Danum & Rajang basins"
    },
    arch: {
      title: "Multi-Sensor Earth Observation Architecture",
      subtitle: "Multi-modal ingestion pipeline from orbit to AST-verified causal flood inference"
    }
  };

  telemetryViewTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const targetView = this.getAttribute('data-view');
      if (!targetView || !viewPanels[targetView]) return;

      // Update tabs
      telemetryViewTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      // Update panels
      Object.keys(viewPanels).forEach(key => {
        if (viewPanels[key]) {
          if (key === targetView) {
            viewPanels[key].style.display = 'block';
            viewPanels[key].classList.add('active');
          } else {
            viewPanels[key].style.display = 'none';
            viewPanels[key].classList.remove('active');
          }
        }
      });

      // Update header labels
      if (VIEW_TITLES[targetView]) {
        if (telemetryViewTitle) telemetryViewTitle.textContent = VIEW_TITLES[targetView].title;
        if (telemetryViewSubtitle) telemetryViewSubtitle.textContent = VIEW_TITLES[targetView].subtitle;
      }
    });
  });

  // --------------------------------------------------------------------------
  // 13. DATA ACCESS FORM & INSTANT TOKEN ISSUER
  // --------------------------------------------------------------------------
  const dataAccessForm = document.getElementById('data-access-form');
  if (dataAccessForm) {
    dataAccessForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const nameInput = document.getElementById('researcher-name');
      const emailInput = document.getElementById('researcher-email');
      const basinInput = document.getElementById('catchment-basin');
      const useInput = document.getElementById('intended-use');

      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const basin = basinInput ? basinInput.value : "kinabatangan";
      const use = useInput ? useInput.value : "flood";

      if (!name || !email) {
        showToast("Please enter your name and institutional email.");
        return;
      }

      // Generate random unique key
      const randHex = Math.random().toString(16).substring(2, 10);
      const token = `bs_live_${basin}_${randHex}`;
      const zarrEndpoint = `https://zarr.borneostack.com/v1/catchments/${basin}.zarr`;
      const stacEndpoint = `https://stac.borneostack.com/v1/collections/sentinel-1-2-borneo`;

      const content = `
        <div style="font-family:'Inter',sans-serif; color:#e2e8f0; line-height:1.65;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:rgba(0,208,132,0.15); color:#00d084; font-weight:bold;">&#10003;</span>
            <span style="font-size:14px; color:#00d084; font-family:'JetBrains Mono',monospace; font-weight:600;">TOKEN ISSUED • OPEN SCIENCE TIER</span>
          </div>
          <p style="font-size:13px; color:#cbd5e1; margin-bottom:12px;">
            Welcome, <strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}). An instant academic research grant token has been provisioned for the <strong>${escapeHtml(basin.toUpperCase())}</strong> spatiotemporal data cube.
          </p>

          <label style="font-size:11px; font-family:'JetBrains Mono',monospace; color:#94a3b8; text-transform:uppercase;">Programmatic API Bearer Token</label>
          <div style="display:flex; gap:8px; margin-top:4px; margin-bottom:14px;">
            <input type="text" readonly value="${token}" id="generated-token-input" style="flex:1; background:#06111a; border:1px solid #00d084; color:#00d084; font-family:'JetBrains Mono',monospace; font-size:13px; padding:8px 12px; border-radius:4px;">
            <button type="button" class="btn btn-primary" id="btn-copy-token" style="font-size:12px; padding:0 14px;">Copy</button>
          </div>

          <div style="background:#090f17; border:1px solid #1e293b; border-radius:6px; padding:12px; font-size:12px; margin-bottom:12px;">
            <div style="color:#38bdf8; font-family:'JetBrains Mono',monospace; margin-bottom:4px;">Cloud Endpoints:</div>
            <div style="color:#94a3b8; font-family:'JetBrains Mono',monospace; word-break:break-all;"><strong>Zarr Manifest:</strong> ${zarrEndpoint}</div>
            <div style="color:#94a3b8; font-family:'JetBrains Mono',monospace; word-break:break-all; margin-top:3px;"><strong>STAC Catalog:</strong> ${stacEndpoint}</div>
          </div>

          <p style="font-size:11px; color:#64748b; font-family:'JetBrains Mono',monospace;">
            * Non-commercial academic license. Rate limit: 50,000 requests/day.
          </p>
        </div>
      `;

      openModal("Academic Data Access Granted", content);
      showToast("Access token & Zarr manifest generated!");

      setTimeout(() => {
        const copyTokenBtn = document.getElementById('btn-copy-token');
        if (copyTokenBtn) {
          copyTokenBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(token).then(() => {
              showToast("API token copied to clipboard!");
            });
          });
        }
      }, 50);
    });
  }

  // --------------------------------------------------------------------------
  // 14. COPY SDK CODE BUTTON
  // --------------------------------------------------------------------------
  const copySdkBtn = document.getElementById('btn-copy-sdk');
  if (copySdkBtn) {
    copySdkBtn.addEventListener('click', function () {
      const codeSnippet = `import xarray as xr
from borneostack import Client

client = Client(api_key="bs_live_kinabatangan")

# Stream 10m cloud-penetrating SAR tensor
ds = client.open_catchment(
    basin="kinabatangan",
    variables=["sar_vv", "sar_vh", "soil_moisture"],
    time=("2024-01-01", "2026-11-20")
)

# Compute counterfactual do-calculus flood risk
risk = client.causal_inundation(ds, do_canopy_loss=0.20)
print(f"Attributable Runoff Risk: {risk.mean().values:.2%}")`;

      navigator.clipboard.writeText(codeSnippet).then(() => {
        showToast("Python SDK snippet copied to clipboard!");
      }).catch(() => {
        showToast("Code copied!");
      });
    });
  }

  console.log("BorneoStack Research UI & Data Layer Initialized successfully.");

})();

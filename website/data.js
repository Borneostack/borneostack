/**
 * BorneoStack Research Data Layer
 * Defines canonical research programs, publications, protocols, telemetry simulator scenarios, and metadata.
 * Author: Dale Jeffrey (Principal Investigator)
 * Organization: BorneoStack Research (Kota Kinabalu, Sabah, Malaysia)
 */

(function (global) {
  'use strict';

  const BORNEOSTACK_DATA = {
    PI_PROFILE: {
      name: "Dale Jeffrey",
      title: "Principal Investigator & Machine Learning Researcher",
      organization: "BorneoStack Research",
      location: "Kota Kinabalu, Sabah, Malaysia",
      email: "dale.jeffrey@borneostack.com",
      orcid: "0009-0004-8123-9942",
      bio: "Conducting causal machine learning, spatiotemporal Earth observation fusion, and automated agentic verification across tropical Southeast Asia ecosystems."
    },

    RESEARCH_PROGRAMS: [
      {
        id: "borneo-geocausal",
        title: "BorneoGeoCausal: Benchmarking Causal Inference for Tropical Deforestation & Flood Risk",
        status: "Active Study",
        statusType: "active",
        tags: ["Causal ML", "Spatiotemporal", "Earth Observation", "Sentinel-1 SAR"],
        summary: "Multi-sensor fusion benchmark separating anthropogenic canopy disturbance from monsoon precipitation across 12 Sabah and Sarawak river basins.",
        protocol: {
          hypothesis: "Anthropogenic road intrusion and canopy clearance significantly accelerate river basin peak runoff during intense Northeast Monsoon events compared to intact forest catchments.",
          coordinates: "5°58'17\"N 116°04'30\"E (Kinabatangan & Crocker Range Basins)",
          sensors: "Sentinel-1 C-band SAR (VV/VH 12-day repeat), Sentinel-2 MSI (10m bands), GPM IMERG Precipitation Telemetry, In-situ River Gauges",
          causalMethod: "Double Machine Learning (DML) with Spatiotemporal Instrumental Variables (topographic ridge slope as instrument for road accessibility) and synthetic controls",
          outOfDistribution: "Stress-tested against the 2021-2022 anomalous La Niña monsoon storm deluge (rainfall > 350mm/72h)",
          benchmarkMetrics: [
            {
              metric: "CATE Estimation Bias",
              value: "±0.042 (vs SCM Ground Truth)",
              note: "41% lower bias than unadjusted Random Forests"
            },
            {
              metric: "Flood Inundation AUROC",
              value: "0.941",
              note: "Evaluated on Sentinel-1 radar water masks"
            },
            {
              metric: "Spatial Cross-Validation F1",
              value: "0.892",
              note: "Leave-one-basin-out geographic split"
            }
          ],
          dagSchema: {
            nodes: [
              { id: "A", label: "Road & Canopy Intrusion (Treatment A)", type: "treatment" },
              { id: "Y", label: "Basin Peak Runoff (Outcome Y)", type: "outcome" },
              { id: "Z", label: "Topographic Ridge Slope (Instrument Z)", type: "instrument" },
              { id: "W1", label: "Monsoon Precipitation (Confounder W1)", type: "confounder" },
              { id: "W2", label: "Soil Permeability & Lithology (Confounder W2)", type: "confounder" }
            ],
            edges: [
              { from: "Z", to: "A", description: "Topographic slope constrains logging road expansion" },
              { from: "A", to: "Y", description: "Causal acceleration of peak runoff hydrographs" },
              { from: "W1", to: "Y", description: "Direct meteorological driving force" },
              { from: "W1", to: "A", description: "Seasonal logging accessibility shifts" },
              { from: "W2", to: "Y", description: "Soil saturation threshold dynamics" }
            ]
          },
          artifacts: [
            "Dataset v1.2 (HDF5 / Zarr)",
            "PyTorch-Geometric Benchmark Harness",
            "Causal DAG Schema (BIF/GraphML)"
          ]
        }
      },
      {
        id: "agentic-feature-eng",
        title: "Agentic Feature Engineering & Literature Synthesis for Geospatial Telemetry",
        status: "Working Paper",
        statusType: "working-paper",
        tags: ["Frontier Reasoning Models", "Automated Code Execution", "Methodological Verification"],
        summary: "Evaluates whether frontier reasoning models can autonomously translate hydrology and ecology literature into executable Python geospatial pipelines without silent methodological bugs.",
        protocol: {
          hypothesis: "Domain-constrained reasoning models with AST validation can reliably extract spatiotemporal features from peer-reviewed literature without introducing spatial autocorrelation leakage.",
          framework: "ReAct + Sandboxed Python Execution + AST Metaprogramming Inspector",
          testHarness: "128 synthetic and real-world hydrological pipeline translation tasks from 40 hydrology & remote sensing papers",
          failureTaxonomy: [
            {
              type: "Temporal Leakage",
              baseline: "28.4% occurrence",
              agenticAST: "0.0% (guaranteed by causal masking)"
            },
            {
              type: "Spatial Autocorrelation Bleed",
              baseline: "34.1% occurrence",
              agenticAST: "1.6% (spatial block cross-validation enforcement)"
            },
            {
              type: "Sensor Calibration Drift (Radar)",
              baseline: "19.5% occurrence",
              agenticAST: "0.8% (automated radiometric terrain correction check)"
            }
          ],
          codeSample: `from borneostack.causal import SpatialBlockDML\n# Verified pipeline with zero-leakage AST assertions\nestimator = SpatialBlockDML(\n    n_splits=5,\n    buffer_distance_km=25.0,\n    ast_linter_mode="strict"\n)\nestimator.fit(X=sar_features, T=canopy_loss, Y=runoff_depth)`,
          artifacts: [
            "GeoLeakBenchmark Suite",
            "Automated AST Verification Linter",
            "Working Paper PDF Draft"
          ]
        }
      },
      {
        id: "biodiversity-drift",
        title: "Biodiversity Shift Forecasting Under Rapid Land-Use & Microclimate Drift",
        status: "Open Dataset",
        statusType: "open-data",
        tags: ["Biodiversity", "Remote Sensing", "Canopy Corridors", "GEDI LiDAR"],
        summary: "Continuous tracking of tropical canopy fragmentation, microclimate heat islands, and wildlife habitat connectivity corridors across Borneo.",
        protocol: {
          hypothesis: "Canopy structural loss measured via GEDI LiDAR waveform metrics and Sentinel-2 NDVI time-series predicts microclimate temperature variance (+2.8°C at edges) and corridor disconnection.",
          coverage: "Pan-Borneo (Sabah, Sarawak, Kalimantan, Brunei) 743,330 km²",
          sensors: "GEDI Level 2A/2B Canopy Height Profiles + Sentinel-2 Level-2A BOA Reflectance",
          metrics: [
            {
              metric: "Corridor Connectivity Index",
              value: "0.784 (Sabah Central Range)",
              note: "Graph centrality across protected conservation areas"
            },
            {
              metric: "Edge Effect Microclimate Delta",
              value: "+2.8°C (±0.4°C)",
              note: "Landsat-8 Thermal Infrared vs core rainforest interior"
            },
            {
              metric: "Canopy Height Loss Rate",
              value: "-1.4% / yr in buffer zones",
              note: "Calibrated against airborne LiDAR baselines"
            }
          ],
          checksum: "sha256: 8f4e2c91b5a839d04... (4.2 TB open mirror on Zenodo)",
          artifacts: [
            "Pan-Borneo Canopy Corridor Graph",
            "Zenodo Dataset Mirror",
            "Interactive QGIS Plugin"
          ]
        }
      }
    ],

    PUBLICATIONS: [
      {
        id: "pub-1",
        year: 2026,
        category: "Benchmarks",
        categoryLabel: "Benchmark",
        title: "BorneoGeoCausal: A Benchmark for Causal Inference in Tropical Deforestation and Monsoon Inundation",
        author: "Dale Jeffrey",
        venue: "BorneoStack Research Tech Report BSR-2026-01",
        doi: "10.5281/zenodo.borneostack.2026.01",
        abstract: "Tropical deforestation and climate-induced extreme monsoon precipitation interact in complex, non-linear spatiotemporal regimes. Standard supervised machine learning models often mistake seasonal inundation correlations for causal land-use degradation. We introduce BorneoGeoCausal, a benchmark across 12 major watershed basins in Sabah and Sarawak, fusing Sentinel-1 synthetic aperture radar, Sentinel-2 optical imagery, and river gauge telemetry. We formulate causal identification under unobserved confounding and demonstrate that spatiotemporal Double Machine Learning reduces causal treatment effect estimation error by 41% compared to unadjusted deep learning baselines.",
        bibtex: `@article{jeffrey2026borneogeocausal,\n  title={BorneoGeoCausal: A Benchmark for Causal Inference in Tropical Deforestation and Monsoon Inundation},\n  author={Jeffrey, Dale},\n  journal={BorneoStack Research Technical Reports},\n  volume={1},\n  number={1},\n  pages={1--28},\n  year={2026},\n  publisher={BorneoStack Research},\n  address={Kota Kinabalu, Sabah, Malaysia},\n  doi={10.5281/zenodo.borneostack.2026.01}\n}`,
        github: "https://github.com/borneostack/borneo-geocausal"
      },
      {
        id: "pub-2",
        year: 2026,
        category: "Working Papers",
        categoryLabel: "Working Paper",
        title: "Agentic Feature Engineering for Geospatial Telemetry: Literature-Grounded Code Synthesis without Methodological Leakage",
        author: "Dale Jeffrey",
        venue: "Working Paper · Under Review",
        doi: "arXiv:2603.11894",
        abstract: "Translating empirical environmental science papers into operational machine learning pipelines requires complex spatial feature engineering. However, automated code synthesis via large reasoning models frequently introduces silent methodological bugs, notably spatial autocorrelation leakage and lookahead temporal leakage. We present an agentic framework combining frontier reasoning models with abstract syntax tree (AST) constraint checking and causal validation tests. Across 128 benchmark hydrology tasks, our system reduces spatial leakage from 34.1% to 1.6% while preserving algorithmic fidelity.",
        bibtex: `@article{jeffrey2026agenticgeospatial,\n  title={Agentic Feature Engineering for Geospatial Telemetry: Literature-Grounded Code Synthesis without Methodological Leakage},\n  author={Jeffrey, Dale},\n  journal={arXiv preprint arXiv:2603.11894},\n  year={2026},\n  note={Working paper under review}\n}`,
        github: "https://github.com/borneostack/agentic-geo-features"
      },
      {
        id: "pub-3",
        year: 2026,
        category: "Geospatial Pipelines",
        categoryLabel: "Pipeline",
        title: "Reproducible Sentinel-1 SAR and Sentinel-2 Multispectral Fusion Pipelines for Tropical Cloud-Penetrating Canopy Monitoring",
        author: "Dale Jeffrey",
        venue: "Open Geospatial Software Suite · BorneoStack Research",
        doi: "10.5281/zenodo.borneostack.2026.03",
        abstract: "Persistent cloud cover in equatorial Borneo severely impedes continuous optical Earth observation. We publish an open-source, reproducible end-to-end processing pipeline that harmonizes Sentinel-1 C-band SAR dual-polarization (VV/VH) backscatter with Sentinel-2 multispectral surface reflectance. The pipeline features automated radiometric terrain correction using Copernicus 30m DEM, speckle filtering, and spatiotemporal gap-filling algorithms optimized for distributed execution.",
        bibtex: `@software{jeffrey2026canopypipeline,\n  title={Reproducible Sentinel-1 SAR and Sentinel-2 Multispectral Fusion Pipelines for Tropical Cloud-Penetrating Canopy Monitoring},\n  author={Jeffrey, Dale},\n  year={2026},\n  publisher={BorneoStack Research},\n  version={v2.1.0},\n  url={https://github.com/borneostack/canopy-corridor-pipeline}\n}`,
        github: "https://github.com/borneostack/canopy-corridor-pipeline"
      },
      {
        id: "pub-4",
        year: 2026,
        category: "Benchmarks",
        categoryLabel: "Benchmark",
        title: "Borneo-HydroSAR: An Open Benchmark for Cloud-Penetrating Flood Depth Estimation in Tropical River Basins",
        author: "Dale Jeffrey",
        venue: "BorneoStack Research Open Datasets"
        ,
        doi: "10.5281/zenodo.borneostack.2026.04",
        abstract: "Flash flooding in the Kinabatangan and Papar river catchments threatens rural communities and unique riparian biodiversity. We release Borneo-HydroSAR, a curated spatiotemporal dataset containing 1,420 paired SAR acquisitions, hydrodynamic gauge hydrographs, and DEM cross-sections across 5 extreme monsoon seasons. We establish standardized out-of-distribution benchmark splits to test model generalizability across unmonitored sub-basins.",
        bibtex: `@dataset{jeffrey2026hydrosar,\n  title={Borneo-HydroSAR: An Open Benchmark for Cloud-Penetrating Flood Depth Estimation in Tropical River Basins},\n  author={Jeffrey, Dale},\n  year={2026},\n  publisher={Zenodo},\n  doi={10.5281/zenodo.borneostack.2026.04}\n}`,
        github: "https://github.com/borneostack/borneo-hydrosar"
      }
    ],

    SIMULATOR_SCENARIOS: {
      "scenario-a": {
        id: "scenario-a",
        name: "Scenario A: Pristine Forest / Base Flow",
        shortLabel: "Scenario A",
        subtitle: "Pristine Forest & Base Flow Baseline",
        sarBackscatter: "-12.4",
        sarUnit: "dB",
        ndvi: "0.86",
        ndviUnit: "",
        soilMoisture: "38",
        soilMoistureUnit: "%",
        floodRisk: "12",
        floodRiskUnit: "%",
        riskLevel: "Low",
        riskClass: "risk-low",
        reasoning: "Pristine multi-tiered tropical dipterocarp canopy maintains high optical NDVI (>0.85) with stable dual-polarization volume scattering (-12.4 dB). Deep biological root matrices and intact forest litter provide maximum infiltration capacity, stabilizing sub-surface percolation and yielding minimal causal flood hazard during standard tropical diurnal rainfall."
      },
      "scenario-b": {
        id: "scenario-b",
        name: "Scenario B: Northeast Monsoon Cloudburst",
        shortLabel: "Scenario B",
        subtitle: "Monsoon Surge Cloudburst (Intact Forest)",
        sarBackscatter: "-8.2",
        sarUnit: "dB",
        ndvi: "0.82",
        ndviUnit: "",
        soilMoisture: "84",
        soilMoistureUnit: "%",
        floodRisk: "48",
        floodRiskUnit: "%",
        riskLevel: "Moderate",
        riskClass: "risk-moderate",
        reasoning: "Extreme monsoon precipitation (>180mm/24h) elevates topsoil dielectric permittivity, increasing Sentinel-1 C-band radar backscatter to -8.2 dB. High canopy density attenuates rainfall kinetic impact; flood risk rises moderately primarily through channel hydraulic surcharge rather than uncontrolled surface runoff."
      },
      "scenario-c": {
        id: "scenario-c",
        name: "Scenario C: 35% Canopy Loss + Monsoon Storm",
        shortLabel: "Scenario C",
        subtitle: "Compound Degradation + Monsoon Storm",
        sarBackscatter: "-19.1",
        sarUnit: "dB",
        ndvi: "0.41",
        ndviUnit: "",
        soilMoisture: "97",
        soilMoistureUnit: "%",
        floodRisk: "91",
        floodRiskUnit: "%",
        riskLevel: "Severe Causal Hazard",
        riskClass: "risk-severe",
        reasoning: "Severe canopy degradation (NDVI collapses to 0.41) coupled with intense monsoon precipitation induces standing surface water. The resulting water surface acts as a specular reflector of microwave pulses, causing Sentinel-1 radar backscatter to drop dramatically to -19.1 dB. Spatiotemporal Double Machine Learning indicates an estimated causal +43% flood peak acceleration directly attributable to forest clearance."
      }
    },

    RESEARCH_OVERVIEW: {
      title: "BorneoStack Research Overview & Scientific Mission",
      institution: "BorneoStack Research",
      location: "Kota Kinabalu, Sabah, Malaysia",
      leadResearcher: "Dale Jeffrey",
      focusAreas: [
        {
          name: "Spatiotemporal Causal Inference",
          description: "Disentangling true causal effects of land-use changes from seasonal monsoon precipitation using Double Machine Learning, instrumental variables, and synthetic controls."
        },
        {
          name: "Cloud-Penetrating Earth Observation",
          description: "Harmonizing Sentinel-1 Synthetic Aperture Radar (SAR) with Sentinel-2 multispectral imagery and GEDI waveform LiDAR across cloud-dense equatorial rainforests."
        },
        {
          name: "Agentic Code Verification & AST Analysis",
          description: "Preventing spatial autocorrelation leakage and temporal lookahead bias in LLM-synthesized geospatial analysis pipelines via automated static AST linters."
        },
        {
          name: "Open Benchmarks & Reproducibility",
          description: "Releasing standardized tropical benchmarks, open data repositories, and verifiable code harnesses to accelerate environmental data science."
        }
      ],
      missionStatement: "BorneoStack Research provides mathematically rigorous, open-source causal machine learning benchmarks and Earth observation tools designed to understand tropical ecosystem shifts, guide evidence-based reforestation, and mitigate catastrophic flood hazards across Borneo."
    }
  };

  // Attach to global window
  if (typeof window !== 'undefined') {
    window.BORNEOSTACK_DATA = BORNEOSTACK_DATA;
  }

  // CommonJS export support for testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BORNEOSTACK_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);

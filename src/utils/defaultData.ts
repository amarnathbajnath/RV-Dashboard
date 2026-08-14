import { AppSettings, Client, MaterialItem, Quote } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Risha Vishal Electrical & Construction Co. Ltd.',
  companySubtitle: 'Commercial & Industrial Electrical Contracting Specialists',
  companyAddress: '123 Southern Main Road, Chaguanas, Trinidad & Tobago',
  companyPhone: '+1 (868) 672-9900 / 755-4321',
  companyEmail: 'quotes@rishavishal.co.tt',
  taxRegistrationNumber: 'VAT-TT-894210',
  defaultMarkupPct: 15.0,
  defaultVatPct: 12.5,
  defaultLabourRate: 65.0,
  defaultInspectionRate: 150.0,
  currencySymbol: '$',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQF-dVNCimVYFht-LgwEeKT4rEtW-IDphibc5oSV60YBjLxGn4KGT45nU2U58EfBCYbF0UdDxdoe88r/pub?gid=0&single=true&output=csv',
  autoSave: true,
};

export const DEFAULT_CLIENTS: Client[] = [];

export const DEFAULT_INVENTORY: MaterialItem[] = [
  // Wiring & Cables
  { SKU: 'WIR-1001', Item: '10AWG Copper Wire (Roll)', Unit: 'Roll (100m)', Price: 120.00, Category: 'Wiring & Cables', inStock: 45 },
  { SKU: 'WIR-1002', Item: '12AWG THHN Stranded Wire (Black)', Unit: 'Roll (100m)', Price: 85.50, Category: 'Wiring & Cables', inStock: 60 },
  { SKU: 'WIR-1003', Item: '12AWG THHN Stranded Wire (Red)', Unit: 'Roll (100m)', Price: 85.50, Category: 'Wiring & Cables', inStock: 58 },
  { SKU: 'WIR-1004', Item: '14AWG Building Wire (White)', Unit: 'Roll (100m)', Price: 68.00, Category: 'Wiring & Cables', inStock: 80 },
  { SKU: 'WIR-1005', Item: '6AWG Earth Grounding Copper Wire', Unit: 'Meter', Price: 9.75, Category: 'Wiring & Cables', inStock: 350 },
  { SKU: 'WIR-1006', Item: '3-Core 2.5mm Armoured Cable (SWA)', Unit: 'Meter', Price: 18.50, Category: 'Wiring & Cables', inStock: 200 },
  { SKU: 'WIR-1007', Item: '4-Core 16mm Industrial Feeder Cable', Unit: 'Meter', Price: 64.00, Category: 'Wiring & Cables', inStock: 120 },

  // Breakers & Distribution Panels
  { SKU: 'BRK-2001', Item: 'Square D 20A Single Pole Breaker', Unit: 'each', Price: 24.50, Category: 'Breakers & Panels', inStock: 90 },
  { SKU: 'BRK-2002', Item: 'Square D 30A Double Pole Breaker', Unit: 'each', Price: 52.00, Category: 'Breakers & Panels', inStock: 40 },
  { SKU: 'BRK-2003', Item: 'Schneider 100A 3-Phase Main Breaker', Unit: 'each', Price: 380.00, Category: 'Breakers & Panels', inStock: 12 },
  { SKU: 'BRK-2004', Item: '12-Way Commercial Distribution Panel Board', Unit: 'each', Price: 420.00, Category: 'Breakers & Panels', inStock: 8 },
  { SKU: 'BRK-2005', Item: '24-Way 3-Phase Main Switchboard Panel', Unit: 'each', Price: 890.00, Category: 'Breakers & Panels', inStock: 4 },
  { SKU: 'BRK-2006', Item: 'GFCI Safety Receptacle Breaker 20A', Unit: 'each', Price: 65.00, Category: 'Breakers & Panels', inStock: 35 },

  // Conduits & Fittings
  { SKU: 'CND-3001', Item: '3/4" EMT Galvanized Conduit (10ft)', Unit: 'Length', Price: 14.50, Category: 'Conduits & Fittings', inStock: 250 },
  { SKU: 'CND-3002', Item: '1" EMT Galvanized Conduit (10ft)', Unit: 'Length', Price: 21.00, Category: 'Conduits & Fittings', inStock: 180 },
  { SKU: 'CND-3003', Item: '2" Heavy Duty PVC Underground Conduit', Unit: 'Length', Price: 32.50, Category: 'Conduits & Fittings', inStock: 95 },
  { SKU: 'CND-3004', Item: '3/4" EMT Set Screw Connectors (Pack of 10)', Unit: 'Pack', Price: 18.00, Category: 'Conduits & Fittings', inStock: 50 },
  { SKU: 'CND-3005', Item: '4x4 Galvanized Junction Box with Cover', Unit: 'each', Price: 12.50, Category: 'Conduits & Fittings', inStock: 140 },
  { SKU: 'CND-3006', Item: 'Liquidtight Flexible Conduit 1/2" (50ft)', Unit: 'Roll', Price: 78.00, Category: 'Conduits & Fittings', inStock: 22 },

  // Lighting & Fixtures
  { SKU: 'LGT-4001', Item: '2x4 Commercial LED Troffer Panel 40W 5000K', Unit: 'each', Price: 68.00, Category: 'Lighting & Fixtures', inStock: 65 },
  { SKU: 'LGT-4002', Item: '150W Industrial UFO LED High Bay Light', Unit: 'each', Price: 145.00, Category: 'Lighting & Fixtures', inStock: 28 },
  { SKU: 'LGT-4003', Item: 'Emergency Battery Backup Exit Sign combo', Unit: 'each', Price: 82.00, Category: 'Lighting & Fixtures', inStock: 30 },
  { SKU: 'LGT-4004', Item: 'Waterproof Outdoor LED Floodlight 50W', Unit: 'each', Price: 55.00, Category: 'Lighting & Fixtures', inStock: 42 },

  // Metering & Switchgear
  { SKU: 'MTR-5001', Item: 'T&TEC Approved 200A Meter Socket Base', Unit: 'each', Price: 260.00, Category: 'Metering & Switchgear', inStock: 15 },
  { SKU: 'MTR-5002', Item: 'Heavy Duty 200A 3-Phase Disconnect Switch', Unit: 'each', Price: 410.00, Category: 'Metering & Switchgear', inStock: 9 },
  { SKU: 'MTR-5003', Item: 'Surge Protective Device (SPD) Type 2', Unit: 'each', Price: 175.00, Category: 'Metering & Switchgear', inStock: 24 },

  // Transformers & Heavy Equipment
  { SKU: 'TRN-6001', Item: '75kVA 3-Phase Step-Down Dry Transformer', Unit: 'each', Price: 4200.00, Category: 'Transformers & Heavy', inStock: 2 },
  { SKU: 'TRN-6002', Item: '45kVA 480V to 208V Isolation Transformer', Unit: 'each', Price: 2850.00, Category: 'Transformers & Heavy', inStock: 3 },
  { SKU: 'TRN-6003', Item: 'Commercial Automatic Transfer Switch (ATS) 100A', Unit: 'each', Price: 1450.00, Category: 'Transformers & Heavy', inStock: 4 },
];

export const INITIAL_QUOTES: Quote[] = [];

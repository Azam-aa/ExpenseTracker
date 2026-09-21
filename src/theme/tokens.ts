// Sampled directly from pixel analysis of screenshots
export const tokens = {
  colors: {
    bg: '#0f1513',           // main app background (very dark green, almost black)
    section: '#252b29',      // Income & Expense section header bars
    accentCard: '#354c44',   // date card, summary card, selected segment, chart period chip
    sheet: '#3f4a46',        // bottom sheet background
    menu: '#1e2624',         // 3-dot popup menu
    searchBar: '#323836',    // search top bar
    outline: '#3f4946',      // card borders, dividers
    outlineCard: '#3f4946',
    segmentBorder: '#6b7370',// segmented control pill border
    primary: '#7fd6bc',      // active tab underline, check icon, active accents
    primaryActive: '#86d6bd',
    fab: '#005142',          // floating action button background
    onFab: '#a2f2d9',        // plus and pdf icons on FAB
    onPrimary: '#00382c',    // checkmark on mint button
    text: '#e0e3e1',         // main text
    textDim: '#bfc9c4',      // secondary text, hints, placeholders
    income: '#7cdc7b',       // income amounts & bars
    expense: '#fb7a75',      // expense amounts & bars
    warning: '#ffc107',      // warning triangle
    handle: '#c5cbc8',       // bottom sheet collapse handle
    white: '#ffffff',
    transparent: 'transparent'
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    sizes: {
      appBarTitle: '17px',
      screenTitle: '22px',
      tabLabel: '14px',
      sectionBar: '16px',
      body: '15px',
      hint: '13px',
      small: '12px',
      dateBox: '30px',
      summaryAmount: '16px',
      summaryLabel: '14px'
    },
    weights: {
      regular: 400,
      medium: 500,
      bold: 700
    }
  },
  radii: {
    dateCard: '8px',
    dayCard: '16px',
    chartCard: '18px',
    sheetTop: '28px',
    fab: '16px',
    chip: '12px',
    menu: '12px',
    pill: '28px',
    circle: '50%'
  },
  shadows: {
    fab: '0 4px 12px rgba(0, 0, 0, 0.4)',
    menu: '0 8px 24px rgba(0, 0, 0, 0.55)',
    sheet: '0 -4px 20px rgba(0, 0, 0, 0.4)'
  }
} as const;

export type ThemeTokens = typeof tokens;

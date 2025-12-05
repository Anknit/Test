// Centralized constants for Kite backtesting and trading
module.exports = {
  // Backtest defaults
  DEFAULT_BACKTEST_DAYS: 10,
  DEFAULT_INTERVAL: '2minute',

  // Position sizing / capital
  DEFAULT_CAPITAL: 450000,
  DEFAULT_RISK_PCT: 0.014,

  // Stop/target/tick defaults
  DEFAULT_SL_TICKS: 30,
  DEFAULT_TARGET_TICKS: 70,
  DEFAULT_TICK_VALUE: 10,

  // Fees and slippage
  DEFAULT_COMMISSION_PER_TRADE: 20,
  DEFAULT_SLIPPAGE_PCT: 0.0001,

  // Time / market defaults
  MARKET_OPEN: '09:00',
  MARKET_CLOSE: '23:30',
  DEFAULT_BLOCK_LAST_MINUTES: 30,

  // Signal generation defaults
  DEFAULT_FAST_EMA: 12,
  DEFAULT_SLOW_EMA: 26,
  DEFAULT_RSI_LEN: 14,
  DEFAULT_VOL_MULT: 1.15,
  DEFAULT_BREAKOUT_LOOKBACK: 20,
  DEFAULT_ATR_LEN: 14,

  // Misc
  DEFAULT_MAX_HOLD_CANDLES: 60
};

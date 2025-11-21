/*
Kite Web Backtest & Live Trading (v2)
- Uses Zerodha Kite Web internal APIs via enctoken (or auto-extract from Chrome profile)
- Backtests intraday-only strategies (no new trades in last N minutes, force close same day)
- Adds: instruments CSV lookup, paper-mode simulation, and an order-monitor that cancels opposite leg on fill

Dependencies:
  npm install axios puppeteer dayjs csv-parse

Run examples:
  PAPER mode (safe simulation) - First run fetches and caches data:
    ENCTOKEN="xxx" node kite.js --instrument 120395527 --days 10 --paper

  Use cached data (instant backtesting after first fetch):
    node kite.js --instrument 120395527 --days 10 --paper

  Disable time-based exit (let winners run to target or stop only):
    node kite.js --instrument 120395527 --days 10 --paper --notimeexit
    (or use short form: --nte)

  Force refresh cache (ignore cached data and fetch fresh):
    ENCTOKEN="xxx" node kite.js --instrument 120395527 --days 10 --paper --refresh

  Cached data is stored in ./cache/ directory for instant reuse.

Security: Do NOT share your enctoken. Use paper mode for testing before live.
*/

// HTTP client for making API requests
const axios = require('axios');
// Date/time manipulation library
const dayjs = require('dayjs');
// Dayjs plugins for timezone handling
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const customParse = require('dayjs/plugin/customParseFormat');
// File system module for caching data
const fs = require('fs');
const path = require('path');

// Enable dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParse);

// Set default timezone to Indian Standard Time (IST) for market hours
dayjs.tz.setDefault('Asia/Kolkata');

// ---------------- CONFIG ----------------
// Market opening time (IST) - Indian markets open at 9:00 AM
const MARKET_OPEN = '09:00';
// Market closing time (IST) - Extended for MCX commodities which close at 11:30 PM
const MARKET_CLOSE = '23:30';
// Stop taking new trades this many minutes before market close (risk management)
const NO_ENTRY_BEFORE_CLOSE_MIN = 30;
// Zerodha Kite API endpoint for placing orders
const ORDER_ENDPOINT = 'https://kite.zerodha.com/oms/orders/regular';
// Zerodha Kite API endpoint for fetching order status
const ORDERS_FETCH_ENDPOINT = 'https://kite.zerodha.com/oms/orders';
// URL to download complete instruments list from Zerodha
const INSTRUMENTS_CSV_URL = 'https://kite.zerodha.com/instruments';

/**
 * Create an axios client configured with enctoken authentication
 * @param {string} enctoken - Zerodha enctoken from cookies (obtained after login)
 * @returns {axios.AxiosInstance} Configured axios instance
 */
function axiosWithEnctoken(enctoken) {
  return axios.create({
    headers: {
      'Authorization': `enctoken ${enctoken}`, // Enctoken-based auth (alternative to API key)
      'Referer': 'https://kite.zerodha.com/', // Required referer header
      'User-Agent': 'Mozilla/5.0' // Browser user agent
    },
    timeout: 30000 // 30 second timeout for API requests
  });
}

// ---------------- Fetch historical using internal API ----------------
/**
 * Fetch historical candlestick data from Zerodha Kite internal API
 * @param {string} enctoken - Authentication token
 * @param {string} instrumentToken - Unique instrument identifier (e.g., 120395527 for GOLD)
 * @param {string} interval - Candle interval: '5minute', '15minute', 'day', etc.
 * @param {Date} fromDate - Start date for historical data
 * @param {Date} toDate - End date for historical data
 * @returns {Array} Array of candle objects with OHLCV data
 */
async function fetchHistorical(enctoken, instrumentToken, interval = '2minute', fromDate, toDate) {
  const client = axiosWithEnctoken(enctoken);
  // Build URL with instrument token and interval
  const url = `https://kite.zerodha.com/oms/instruments/historical/${instrumentToken}/${interval}`;
  // Format dates and include open interest (oi) data
  const params = { from: dayjs(fromDate).format('YYYY-MM-DD HH:mm:ss'), to: dayjs(toDate).format('YYYY-MM-DD HH:mm:ss'), oi: 1 };
  const res = await client.get(url, { params });
  // Validate response structure
  if (!res.data || !res.data.data || !res.data.data.candles) throw new Error('No candles returned');
  const candles = res.data.data.candles;
  // Transform raw candle array [timestamp, open, high, low, close, volume] into named objects
  return candles.map(c => ({
    dt: dayjs(c[0]),      // Timestamp
    Open: Number(c[1]),   // Opening price
    High: Number(c[2]),   // High price
    Low: Number(c[3]),    // Low price
    Close: Number(c[4]),  // Closing price
    Volume: Number(c[5])  // Trading volume
  }));
}

// ---------------- Data Caching Functions ----------------
/**
 * Generate cache filename based on instrument, interval, and date range
 * @param {string} instrument - Instrument token
 * @param {string} interval - Candle interval
 * @param {string} from - Start date
 * @param {string} to - End date
 * @returns {string} Cache filename
 */
function getCacheFilename(instrument, interval, from, to) {
  const fromStr = dayjs(from).format('YYYYMMDD');
  const toStr = dayjs(to).format('YYYYMMDD');
  return `cache_${instrument}_${interval}_${fromStr}_${toStr}.json`;
}

/**
 * Save historical data to cache file
 * @param {string} filename - Cache filename
 * @param {Array} data - Historical candle data
 */
function saveCacheData(filename, data) {
  try {
    const cacheDir = path.join(__dirname, 'cache');
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const filepath = path.join(cacheDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✓ Data cached to: ${filepath}`);
  } catch (e) {
    console.error('Cache save error:', e.message);
  }
}

/**
 * Load historical data from cache file
 * @param {string} filename - Cache filename
 * @returns {Array|null} Cached data or null if not found/invalid
 */
function loadCacheData(filename) {
  try {
    const filepath = path.join(__dirname, 'cache', filename);
    if (!fs.existsSync(filepath)) {
      return null;
    }
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    // Reconstruct dayjs objects from ISO strings
    return data.map(c => ({
      ...c,
      dt: dayjs(c.dt)
    }));
  } catch (e) {
    console.error('Cache load error:', e.message);
    return null;
  }
}

/**
 * Fetch historical data with caching support
 * @param {string} enctoken - Authentication token
 * @param {string} instrument - Instrument token
 * @param {string} interval - Candle interval
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @param {boolean} forceRefresh - Force fetch from API (ignore cache)
 * @returns {Array} Historical candle data
 */
async function fetchHistoricalCached(enctoken, instrument, interval, fromDate, toDate, forceRefresh = false) {
  const cacheFilename = getCacheFilename(instrument, interval, fromDate, toDate);

  // Try to load from cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedData = loadCacheData(cacheFilename);
    if (cachedData && cachedData.length > 0) {
      console.log(`✓ Loaded ${cachedData.length} bars from cache: ${cacheFilename}`);
      return cachedData;
    }
  }

  // Fetch from API if cache miss or force refresh
  console.log(`Fetching from API...`);
  const data = await fetchHistorical(enctoken, instrument, interval, fromDate, toDate);

  // Save to cache for future use
  if (data && data.length > 0) {
    saveCacheData(cacheFilename, data);
  }

  return data;
}

// ---------------- Indicators ----------------
/**
 * Calculate Exponential Moving Average (EMA)
 * EMA gives more weight to recent prices compared to SMA
 * @param {Array<number>} series - Price data array
 * @param {number} span - Number of periods for EMA calculation
 * @returns {Array<number>} EMA values for each period
 */
function ema(series, span) {
  const k = 2 / (span + 1);  // Smoothing factor: higher k = more weight on recent data
  const out = [];
  let prev = series[0];  // Initialize with first value
  out.push(prev);
  // Apply exponential smoothing formula: EMA = (Price * k) + (Previous EMA * (1 - k))
  for (let i = 1; i < series.length; i++) {
    prev = series[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

/**
 * Calculate Simple Moving Average (SMA)
 * Equal weight to all prices in the window
 * @param {Array<number>} series - Price data array
 * @param {number} window - Number of periods to average
 * @returns {Array<number|null>} SMA values (null for initial periods)
 */
function sma(series, window) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < series.length; i++) {
    sum += series[i];  // Add current value to rolling sum
    if (i >= window) sum -= series[i - window];  // Remove oldest value from window
    // Only output valid SMA once we have enough data points
    out.push(i >= window - 1 ? sum / window : null);
  }
  return out;
}

/**
 * Calculate Relative Strength Index (RSI)
 * Momentum oscillator measuring speed and magnitude of price changes
 * RSI ranges from 0-100: >70 = overbought, <30 = oversold
 * @param {Array<number>} close - Closing prices
 * @param {number} length - RSI period (typically 14)
 * @returns {Array<number|null>} RSI values
 */
function rsi(close, length = 14) {
  // Calculate price changes (deltas) between consecutive periods
  const deltas = [];
  for (let i = 1; i < close.length; i++) {
    deltas.push(close[i] - close[i - 1]);
  }
  // Separate gains and losses
  const up = [], down = [];
  for (const d of deltas) {
    up.push(d > 0 ? d : 0);      // Gains
    down.push(d < 0 ? -d : 0);   // Losses (converted to positive)
  }
  // Calculate average gains and losses using EMA
  const avgUp = ema(up, length);
  const avgDown = ema(down, length);
  // Calculate RSI using the formula: RSI = 100 - (100 / (1 + RS))
  // where RS = Average Gain / Average Loss
  const out = [null];  // First value is null (need at least 2 prices for delta)
  for (let i = 0; i < avgUp.length; i++) {
    const rs = avgDown[i] === 0 ? 100 : avgUp[i] / avgDown[i];
    out.push(100 - 100 / (1 + rs));
  }
  return out;
}

/**
 * Calculate Average True Range (ATR)
 * Measures market volatility by decomposing the entire range of price movement
 * Higher ATR = higher volatility, Lower ATR = lower volatility
 * @param {Array<number>} o - Open prices
 * @param {Array<number>} h - High prices
 * @param {Array<number>} l - Low prices
 * @param {Array<number>} c - Close prices
 * @param {number} length - ATR period (typically 14)
 * @returns {Array<number>} ATR values
 */
function atr(o, h, l, c, length = 14) {
  const tr = [];  // True Range values
  for (let i = 0; i < c.length; i++) {
    if (i === 0) {
      // First bar: TR is simply high - low
      tr.push(h[i] - l[i]);
      continue;
    }
    // True Range is the greatest of:
    const t1 = h[i] - l[i];                  // Current high - current low
    const t2 = Math.abs(h[i] - c[i - 1]);    // Current high - previous close
    const t3 = Math.abs(l[i] - c[i - 1]);    // Current low - previous close
    tr.push(Math.max(t1, t2, t3));
  }
  // Return smoothed ATR using EMA of True Range values
  return ema(tr, length);
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * Trend-following momentum indicator showing relationship between two EMAs
 * @param {Array<number>} close - Closing prices
 * @param {number} fast - Fast EMA period (default 12)
 * @param {number} slow - Slow EMA period (default 26)
 * @param {number} signal - Signal line period (default 9)
 * @returns {Object} {macd, signal, histogram} arrays
 */
function macd(close, fast = 12, slow = 26, signal = 9) {
  const fastEma = ema(close, fast);
  const slowEma = ema(close, slow);
  const macdLine = fastEma.map((f, i) => f - slowEma[i]);
  const signalLine = ema(macdLine, signal);
  const histogram = macdLine.map((m, i) => m - signalLine[i]);
  return { macd: macdLine, signal: signalLine, histogram };
}

// ---------------- Signals ----------------
/**
 * Generate trading signals based on multiple technical indicators
 * Strategy: Trend-following with momentum, volume, and breakout/breakdown confirmation
 * Supports both LONG and SHORT positions
 * @param {Array} candles - OHLCV candle data
 * @param {Object} params - Strategy parameters (EMAs, RSI, volume multiplier, etc.)
 * @param {Array|null} higherTf - Optional higher timeframe trend filter
 * @returns {Array} Enriched candles with indicators and signals (1 = buy/long, -1 = sell/short, 0 = no signal)
 */
function generateSignals(candles, params = {}, higherTf = null) {
  // Extract strategy parameters with defaults
  const fast = params.fast_ema || 20;              // Fast EMA period
  const slow = params.slow_ema || 50;              // Slow EMA period
  const rsiLen = params.rsi_len || 14;             // RSI period
  const volMult = params.vol_mult || 1.2;          // Volume spike multiplier (1.2 = 20% above average)
  const breakoutLook = params.breakout_lookback || 30;  // Lookback period for breakout detection

  // Extract price and volume arrays from candle data
  const close = candles.map(c => c.Close);
  const high = candles.map(c => c.High);
  const low = candles.map(c => c.Low);
  const open = candles.map(c => c.Open);
  const vol = candles.map(c => c.Volume);

  // Calculate all technical indicators
  const emaFast = ema(close, fast);                // Fast EMA for trend
  const emaSlow = ema(close, slow);                // Slow EMA for trend
  const rsiArr = rsi(close, rsiLen);               // RSI for momentum
  const atrArr = atr(open, high, low, close, params.atr_len || 14);  // ATR for volatility/stops
  const volSma = sma(vol, 50);                     // Average volume for comparison
  const macdData = macd(close, 12, 26, 9);         // MACD for trend strength

  const signals = [];
  for (let i = 0; i < candles.length; i++) {
    // Bullish breakout detection: price breaks above recent high
    const highLook = i - 1 - (breakoutLook - 1) >= 0 ? Math.max(...high.slice(i - breakoutLook, i)) : null;
    const bullishBreakout = highLook !== null ? close[i] > highLook : false;

    // Bearish breakdown detection: price breaks below recent low
    const lowLook = i - 1 - (breakoutLook - 1) >= 0 ? Math.min(...low.slice(i - breakoutLook, i)) : null;
    const bearishBreakdown = lowLook !== null ? close[i] < lowLook : false;

    // Volume spike detection: current volume > average * multiplier
    const volSpike = volSma[i] && vol[i] > volSma[i] * volMult;

    // Higher timeframe trend filter (optional multi-timeframe analysis)
    let tfConfirmLong = true;
    let tfConfirmShort = true;
    if (higherTf) {
      tfConfirmLong = close[i] > higherTf[i];   // HTF bullish for longs
      tfConfirmShort = close[i] < higherTf[i];  // HTF bearish for shorts
    }

    // QUALITY OVER QUANTITY: Multi-indicator confirmation for high win rate
    // Goal: 60%+ win rate with positive profit factor

    // BALANCED STRATEGY: Quality signals with reasonable frequency
    // Goal: 50%+ win rate with 1.5+ profit factor

    // 1. TREND: Clear directional bias
    const emaGap = Math.abs(emaFast[i] - emaSlow[i]);
    const minGap = atrArr[i] * 0.3;  // EMAs must be at least 0.3 ATR apart
    const uptrend = (emaFast[i] > emaSlow[i]) && (emaGap > minGap);
    const downtrend = (emaFast[i] < emaSlow[i]) && (emaGap > minGap);

    // 2. MACD: Trend strength confirmation
    const macdBullish = macdData.histogram[i] > 0;
    const macdBearish = macdData.histogram[i] < 0;

    // 3. RSI: Momentum in favorable zone
    const bullishMomentum = rsiArr[i] !== null && rsiArr[i] > 50 && rsiArr[i] < 75;
    const bearishMomentum = rsiArr[i] !== null && rsiArr[i] < 50 && rsiArr[i] > 25;

    // 4. PRICE ACTION: Directional candle
    const bullCandle = (close[i] > open[i]) && (close[i] > emaFast[i]);
    const bearCandle = (close[i] < open[i]) && (close[i] < emaFast[i]);

    // BUY signal: Core confirmations (slightly relaxed)
    const buySig = uptrend &&                                        // Trend
                   macdBullish &&                                    // MACD histogram positive
                   bullishMomentum &&                                // RSI > 50
                   bullCandle &&                                     // Bullish candle
                   tfConfirmLong;                                    // HTF aligned

    // SELL signal: Core confirmations (slightly relaxed)
    const sellSig = downtrend &&                                     // Trend
                    macdBearish &&                                   // MACD histogram negative
                    bearishMomentum &&                               // RSI < 50
                    bearCandle &&                                    // Bearish candle
                    tfConfirmShort;                                  // HTF aligned

    // Determine signal: 1 = BUY, -1 = SELL, 0 = no action
    let signal = 0;
    if (buySig && !sellSig) signal = 1;      // Long signal
    else if (sellSig && !buySig) signal = -1; // Short signal
    // If both signals occur (rare), stay flat (signal = 0)

    // Combine original candle data with calculated indicators and signal
    signals.push({
      ...candles[i],
      emaFast: emaFast[i],
      emaSlow: emaSlow[i],
      rsi: rsiArr[i],
      atr: atrArr[i],
      volSma: volSma[i],
      signal  // 1 = BUY, -1 = SELL, 0 = no action
    });
  }
  return signals;
}

// ---------------- Utils: fees & sizing ----------------
/**
 * Estimate trading fees and charges for Indian markets
 * @param {number} notional - Trade value (price * quantity)
 * @param {number} commissionPerTrade - Broker commission per trade (default: ₹20)
 * @param {number} turnoverFeePct - Exchange turnover fee percentage (default: 0.02%)
 * @param {number} gstPct - GST on brokerage (default: 18%)
 * @returns {Object} Breakdown of fees: turnoverFees, gstOnBroker, totalFees
 */
function estimateFees(notional, commissionPerTrade = 20, turnoverFeePct = 0.0002, gstPct = 0.18) {
  const turnoverFees = notional * turnoverFeePct;              // Exchange/regulatory fees
  const gstOnBroker = commissionPerTrade * gstPct;             // Tax on brokerage
  const totalFees = commissionPerTrade + gstOnBroker + turnoverFees;  // Total cost
  return { turnoverFees, gstOnBroker, totalFees };
}

/**
 * Calculate position size based on risk management rules
 * Uses fixed-fractional position sizing: risk fixed % of capital per trade
 * @param {Object} params - Configuration object
 * @param {number} params.capital - Total trading capital
 * @param {number} params.riskPct - Risk per trade as decimal (0.01 = 1%)
 * @param {number} params.slTicks - Stop loss distance in ticks
 * @param {number} params.tickValuePerContract - Rupee value per tick per contract
 * @param {number} params.maxContractsLimit - Maximum allowed contracts
 * @returns {number} Number of contracts to trade
 */
function computeQuantity({
  capital = 500000,
  riskPct = 0.01,
  slTicks = 100,
  tickValuePerContract = 10,
  maxContractsLimit = 1000
} = {}) {
  const riskAmount = capital * riskPct;                        // Total rupees to risk
  const riskPerContract = slTicks * tickValuePerContract;      // Risk per contract in rupees
  if (riskPerContract <= 0) return 0;                          // Safety check
  let contracts = Math.floor(riskAmount / riskPerContract);    // Calculate contracts
  if (contracts < 1) contracts = 0;                            // Must trade at least 1
  if (contracts > maxContractsLimit) contracts = maxContractsLimit;  // Risk limit
  return contracts;
}

// ---------------- Orders (paper-mode support) ----------------
/**
 * Place a single order (supports both live and paper trading)
 * @param {Object} params - Order parameters
 * @param {string} params.enctoken - Authentication token
 * @param {string} params.tradingsymbol - Trading symbol (e.g., 'GOLDM25FEBFUT')
 * @param {string} params.exchange - Exchange (MCX, NSE, NFO, etc.)
 * @param {string} params.transaction_type - BUY or SELL
 * @param {number} params.quantity - Number of contracts/shares
 * @param {string} params.product - MIS (intraday) or NRML (delivery/carry forward)
 * @param {string} params.order_type - MARKET, LIMIT, SL (stop-loss), or SL-M
 * @param {number|null} params.price - Limit price (for LIMIT orders)
 * @param {number|null} params.trigger_price - Trigger price (for SL orders)
 * @param {string} params.variety - Order variety (regular, amo, co, iceberg)
 * @param {boolean} params.paperMode - If true, simulate order without actually placing
 * @returns {Object} Order response with order_id and status
 */
async function placeOrderRealtime({
  enctoken,
  tradingsymbol,
  exchange = 'MCX',
  transaction_type = 'BUY',
  quantity,
  product = 'MIS',
  order_type = 'MARKET',
  price = null,
  trigger_price = null,
  variety = 'regular',
  paperMode = false
}) {
  // Paper trading mode: simulate order without hitting real API
  if (paperMode) {
    const executedPrice = price || null;
    const order_id = `PAPER_${Date.now()}`;  // Generate fake order ID
    return { status: 'success', data: { order_id, average_price: executedPrice } };
  }

  // Live trading mode: place real order via Zerodha API
  const client = axiosWithEnctoken(enctoken);
  const body = {
    exchange,
    tradingsymbol,
    transaction_type,
    order_type,
    quantity: String(quantity),  // API expects string
    product,
    validity: 'DAY',  // Order valid for current trading day
    variety
  };
  // Add optional price fields if provided
  if (price !== null) body.price = String(price);
  if (trigger_price !== null) body.trigger_price = String(trigger_price);

  // Convert to URL-encoded form data (Kite API requirement)
  const params = new URLSearchParams();
  Object.entries(body).forEach(([k, v]) => params.append(k, v));

  // Post order to Zerodha
  const resp = await client.post(ORDER_ENDPOINT, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-kite-version': '2.9.8'  // Required API version header
    }
  });
  return resp.data;
}

/**
 * Place an entry order with automatic stop-loss and target orders (bracket order logic)
 * This creates 3 orders: entry (market), stop-loss (SL), and target (limit)
 * @param {Object} params - Order parameters
 * @param {string} params.enctoken - Authentication token
 * @param {string} params.tradingsymbol - Trading symbol
 * @param {string} params.exchange - Exchange
 * @param {string} params.side - BUY or SELL
 * @param {number} params.contracts - Position size
 * @param {string} params.product - MIS or NRML
 * @param {number} params.tickValue - Rupee value per tick
 * @param {number} params.slTicks - Stop-loss distance in ticks
 * @param {number} params.targetTicks - Target distance in ticks
 * @param {number} params.commissionPerTrade - Broker commission
 * @param {number} params.turnoverFeePct - Exchange fees percentage
 * @param {number} params.gstPct - GST on brokerage
 * @param {boolean} params.paperMode - Simulate without real orders
 * @param {number|null} params.lastLTP - Last traded price (for paper mode)
 * @returns {Object} Entry, SL, and target order responses with prices and fees
 */
async function placeEntryWithSLTarget({
  enctoken,
  tradingsymbol,
  exchange = 'MCX',
  side = 'BUY',
  contracts = 1,
  product = 'MIS',
  tickValue = 10,
  slTicks = 100,
  targetTicks = 150,
  commissionPerTrade = 20,
  turnoverFeePct = 0.0002,
  gstPct = 0.18,
  paperMode = false,
  lastLTP = null
}) {
  if (contracts <= 0) throw new Error('contracts must be >=1');
  let executedPrice = null;

  // PAPER MODE: Simulate all three orders
  if (paperMode) {
    executedPrice = lastLTP || null;
    const entryResp = {
      data: {
        order_id: `PAPER_ENTRY_${Date.now()}`,
        average_price: executedPrice
      }
    };
    // Calculate stop-loss price (below entry for BUY, above for SELL)
    const slPrice = executedPrice ? (side === 'BUY' ? executedPrice - slTicks * tickValue : executedPrice + slTicks * tickValue) : null;
    // Calculate target price (above entry for BUY, below for SELL)
    const targetPrice = executedPrice ? (side === 'BUY' ? executedPrice + targetTicks * tickValue : executedPrice - targetTicks * tickValue) : null;
    const slOrder = {
      data: {
        order_id: `PAPER_SL_${Date.now()}`,
        trigger_price: slPrice
      }
    };
    const tgtOrder = {
      data: {
        order_id: `PAPER_TGT_${Date.now()}`,
        price: targetPrice
      }
    };
    const notional = executedPrice ? executedPrice * contracts : 0;
    const fees = estimateFees(notional, commissionPerTrade, turnoverFeePct, gstPct);
    return { entryResp, slOrderResp: slOrder, tgtOrderResp: tgtOrder, executedPrice, slPrice, targetPrice, fees };
  }
  // LIVE MODE: Place actual market entry order
  const entryResp = await placeOrderRealtime({
    enctoken,
    tradingsymbol,
    exchange,
    transaction_type: side,
    quantity: contracts,
    product,
    order_type: 'MARKET',  // Execute immediately at market price
    variety: 'regular',
    paperMode
  });

  // Extract executed price from entry order response
  try {
    executedPrice = entryResp && entryResp.data && entryResp.data.average_price ? Number(entryResp.data.average_price) : null;
  } catch (e) {
    executedPrice = null;
  }
  if (!executedPrice) console.warn('Executed price not returned by entry response. Consider fetching LTP separately and passing as lastLTP.');

  // Calculate stop-loss and target prices based on executed price
  const slPrice = executedPrice ? (side === 'BUY' ? executedPrice - slTicks * tickValue : executedPrice + slTicks * tickValue) : null;
  const slTrigger = slPrice;
  const targetPrice = executedPrice ? (side === 'BUY' ? executedPrice + targetTicks * tickValue : executedPrice - targetTicks * tickValue) : null;

  // Place stop-loss order (opposite side, triggers if price moves against us)
  let slOrderResp = null;
  try {
    slOrderResp = await placeOrderRealtime({
      enctoken,
      tradingsymbol,
      exchange,
      transaction_type: side === 'BUY' ? 'SELL' : 'BUY',  // Opposite side to close position
      quantity: contracts,
      product,
      order_type: 'SL',  // Stop-loss order type
      trigger_price: slTrigger,
      paperMode
    });
  } catch (e) {
    console.error('SL placement error', e && e.response ? e.response.data : e.message);
  }

  // Place target/limit order (opposite side, exits at profit target)
  let tgtOrderResp = null;
  try {
    tgtOrderResp = await placeOrderRealtime({
      enctoken,
      tradingsymbol,
      exchange,
      transaction_type: side === 'BUY' ? 'SELL' : 'BUY',  // Opposite side to close position
      quantity: contracts,
      product,
      order_type: 'LIMIT',  // Limit order at target price
      price: targetPrice,
      paperMode
    });
  } catch (e) {
    console.error('Target placement error', e && e.response ? e.response.data : e.message);
  }

  // Calculate trading fees
  const notional = executedPrice ? executedPrice * contracts : 0;
  const fees = estimateFees(notional, commissionPerTrade, turnoverFeePct, gstPct);
  return { entryResp, slOrderResp, tgtOrderResp, executedPrice, slPrice, targetPrice, fees };
}

// ---------------- Orders monitor ----------------
/**
 * Fetch all orders (open, completed, cancelled) for the day
 * @param {string} enctoken - Authentication token
 * @returns {Array} Array of order objects with status, prices, quantities, etc.
 */
async function fetchOpenOrders(enctoken) {
  const client = axiosWithEnctoken(enctoken);
  const resp = await client.get(ORDERS_FETCH_ENDPOINT, { params: { status: 'all' } });
  return resp.data && resp.data.data ? resp.data.data : [];
}

/**
 * Cancel a pending order by order ID
 * @param {string} enctoken - Authentication token
 * @param {string} orderId - Order ID to cancel
 * @returns {Object|null} Cancellation response or null if failed
 */
async function cancelOrder(enctoken, orderId) {
  if (!enctoken) throw new Error('enctoken required');
  const client = axiosWithEnctoken(enctoken);
  const url = `${ORDER_ENDPOINT}/${orderId}/cancel`;
  try {
    const resp = await client.post(url, null, { headers: { 'x-kite-version': '2.9.8' } });
    return resp.data;
  } catch (e) {
    console.error('Cancel failed', orderId, e && e.response ? e.response.data : e.message);
    return null;
  }
}

/**
 * Continuously monitor orders and auto-cancel opposite leg when one fills
 * When either SL or target fills, cancel the other to avoid double execution
 * This implements OCO (One-Cancels-Other) bracket order logic
 * @param {string} enctoken - Authentication token
 * @param {number} pollIntervalMs - How often to check orders (default: 3000ms)
 * @param {Function} stopSignal - Function that returns true to stop monitoring
 * @param {boolean} paperMode - Skip monitoring in paper trading mode
 */
async function orderMonitorLoop(enctoken, pollIntervalMs = 3000, stopSignal = () => false, paperMode = false) {
  const seenFills = new Set();  // Track which orders we've already processed
  while (!stopSignal()) {
    try {
      // Skip monitoring in paper mode (no real orders to monitor)
      if (paperMode) {
        await new Promise(r => setTimeout(r, pollIntervalMs));
        continue;
      }

      // Fetch current order status
      const orders = await fetchOpenOrders(enctoken);

      // Check each order for fills
      for (const o of orders) {
        // Detect newly filled orders (COMPLETE or FILLED status)
        if (o.status && (o.status === 'COMPLETE' || o.status === 'FILLED') && !seenFills.has(o.order_id)) {
          console.log('Detected fill:', o.order_id, o.tradingsymbol, o.transaction_type, o.status);
          seenFills.add(o.order_id);  // Mark as processed

          // Find and cancel opposite leg (e.g., if target filled, cancel SL)
          for (const o2 of orders) {
            if (o2.order_id !== o.order_id &&
                o2.tradingsymbol === o.tradingsymbol &&  // Same instrument
                o2.quantity === o.quantity &&            // Same size
                (o2.status === 'OPEN' || o2.status === 'TRIGGER PENDING' || o2.status === 'PENDING')) {
              console.log('Cancelling opposite leg', o2.order_id);
              await cancelOrder(enctoken, o2.order_id);
            }
          }
        }
      }
    } catch (e) {
      console.error('Monitor error', e && e.response ? e.response.data : e.message);
    }
    // Wait before next poll
    await new Promise(r => setTimeout(r, pollIntervalMs));
  }
}

// ---------------- Backtest ----------------
/**
 * Backtest intraday trading strategy with same-day exit requirement
 * All positions are closed at market close - no overnight holding
 * Uses ATR-based stops and risk-reward targets
 * @param {Array} signals - Array of candles with signal indicators
 * @param {Object} options - Backtest parameters
 * @param {number} options.capital - Starting capital
 * @param {number} options.sl_atr_mult - Stop-loss as multiple of ATR (1.5 = 1.5x ATR)
 * @param {number} options.rr - Risk-reward ratio for target (1.5 = 1.5x risk)
 * @param {number} options.risk_per_trade_pct - Risk per trade (0.01 = 1% of capital)
 * @param {number} options.commission_per_trade - Fixed commission per trade
 * @param {number} options.slippage_pct - Slippage as percentage (0.0003 = 0.03%)
 * @param {string} options.market_open - Market open time (HH:mm)
 * @param {string} options.market_close - Market close time (HH:mm)
 * @param {number} options.block_last_minutes - Don't enter this many mins before close
 * @returns {Object} Trades array and statistics (total P&L, win rate, avg win/loss)
 */
function backtestSameDay(signals, options = {}) {
  // Extract backtest parameters
  const capital = options.capital || 100000;
  const slAtrMult = options.sl_atr_mult || null;      // Stop-loss as ATR multiple (legacy)
  const slTicks = options.sl_ticks || null;           // FIXED stop-loss in ticks (preferred for scalping)
  const targetTicks = options.target_ticks || null;   // FIXED target in ticks
  const tickValue = options.tick_value || 10;         // Value per tick
  const maxHoldCandles = options.max_hold_candles || null;  // Time-based exit
  const rr = options.rr || 1.5;                       // Target = 1.5x the risk amount (if using ATR)
  const riskPct = options.risk_per_trade_pct || 0.01; // Risk 1% per trade
  const commission = options.commission_per_trade || 20;
  const slippage = options.slippage_pct || 0.0003;    // 0.03% slippage
  const marketOpen = options.market_open || MARKET_OPEN;
  const marketClose = options.market_close || MARKET_CLOSE;
  const blockMins = options.block_last_minutes || NO_ENTRY_BEFORE_CLOSE_MIN;

  let equity = capital;     // Track equity throughout backtest
  let openPos = null;       // Currently open position (null if flat)
  const trades = [];        // Array to store completed trades

  // Iterate through each candle (use next candle for entry/exit prices)
  for (let i = 0; i < signals.length - 1; i++) {
    const row = signals[i];        // Current candle (for signal detection)
    const nextRow = signals[i + 1]; // Next candle (for execution)
    const now = row.dt;
    const nextDt = nextRow.dt;

    // Calculate market open/close times for this date
    const mc = dayjs(now).hour(Number(marketClose.split(':')[0])).minute(Number(marketClose.split(':')[1]));
    const mo = dayjs(now).hour(Number(marketOpen.split(':')[0])).minute(Number(marketOpen.split(':')[1]));

    // Skip bars outside market hours
    if (!(dayjs(now).isAfter(mo) || dayjs(now).isSame(mo)) || dayjs(now).isAfter(mc)) continue;

    // ENTRY LOGIC: Check for long or short signals when flat
    if (!openPos && (row.signal === 1 || row.signal === -1)) {
      const minutesToClose = mc.diff(dayjs(nextDt), 'minute');
      // Don't enter if too close to market close (avoid rushing to exit)
      if (minutesToClose <= blockMins) {
        // Skip entry - not enough time left in session
      } else {
        const side = row.signal === 1 ? 'LONG' : 'SHORT';
        // Calculate entry with slippage
        const entryPrice = nextRow.Open * (1 + (side === 'LONG' ? slippage : -slippage));

        // Calculate stop-loss and target based on position side
        let stop, target, riskPerContract;

        // USE FIXED TICK STOPS if provided (better for scalping)
        if (slTicks !== null && targetTicks !== null) {
          const slDistance = slTicks * tickValue;
          const targetDistance = targetTicks * tickValue;

          if (side === 'LONG') {
            stop = entryPrice - slDistance;
            target = entryPrice + targetDistance;
            if (stop <= 0) continue;
            riskPerContract = slDistance;
          } else {
            stop = entryPrice + slDistance;
            target = entryPrice - targetDistance;
            if (target <= 0) continue;
            riskPerContract = slDistance;
          }
        }
        // FALLBACK: Use ATR-based stops (legacy method)
        else {
          const atrVal = nextRow.atr || row.atr;
          if (side === 'LONG') {
            stop = entryPrice - slAtrMult * atrVal;
            if (stop <= 0) continue;
            riskPerContract = entryPrice - stop;
            target = entryPrice + rr * riskPerContract;
          } else {
            stop = entryPrice + slAtrMult * atrVal;
            riskPerContract = stop - entryPrice;
            target = entryPrice - rr * riskPerContract;
            if (target <= 0) continue;
          }
        }

        // Position sizing: risk fixed % of capital
        const riskAmt = equity * riskPct;        // Amount willing to lose
        const size = riskAmt / riskPerContract;  // Contracts = Risk / Risk per contract

        // Open new position
        openPos = {
          entry_price: entryPrice,
          stop,
          target,
          side,  // Track whether this is LONG or SHORT
          entry_time: nextDt,
          entry_index: i + 1,
          size,
          candles_held: 0  // Track how long we've held the position
        };
      }
    }

    // EXIT LOGIC: Check if open position hits stop, target, time limit, or market close
    if (openPos) {
      const h = nextRow.High, l = nextRow.Low;
      let exitPrice = null, reason = null;

      // Increment candles held counter
      openPos.candles_held++;

      if (openPos.side === 'LONG') {
        // LONG position exit logic
        // Check if stop-loss was hit (price went below stop)
        if (l <= openPos.stop) {
          exitPrice = openPos.stop * (1 - slippage);
          reason = 'stop';
        }
        // Check if target was hit (price went above target)
        else if (h >= openPos.target) {
          exitPrice = openPos.target * (1 - slippage);
          reason = 'target';
        }
        // SCALPING: Exit after max hold time (e.g., 10 candles = 20 mins)
        else if (maxHoldCandles && openPos.candles_held >= maxHoldCandles) {
          exitPrice = nextRow.Close * (1 - slippage);
          reason = 'time_exit';
        }
        // Check if market close reached (force exit all intraday positions)
        else if (dayjs(nextDt).isAfter(mc) || dayjs(nextDt).isSame(mc)) {
          exitPrice = nextRow.Close * (1 - slippage);
          reason = 'market_close';
        }
      } else {
        // SHORT position exit logic
        // Check if stop-loss was hit (price went above stop)
        if (h >= openPos.stop) {
          exitPrice = openPos.stop * (1 + slippage);  // Slippage works against us
          reason = 'stop';
        }
        // Check if target was hit (price went below target)
        else if (l <= openPos.target) {
          exitPrice = openPos.target * (1 + slippage);  // Slippage works against us
          reason = 'target';
        }
        // SCALPING: Exit after max hold time (e.g., 10 candles = 20 mins)
        else if (maxHoldCandles && openPos.candles_held >= maxHoldCandles) {
          exitPrice = nextRow.Close * (1 + slippage);
          reason = 'time_exit';
        }
        // Check if market close reached (force exit all intraday positions)
        else if (dayjs(nextDt).isAfter(mc) || dayjs(nextDt).isSame(mc)) {
          exitPrice = nextRow.Close * (1 + slippage);
          reason = 'market_close';
        }
      }

      // Record trade if exit occurred
      if (exitPrice !== null) {
        // Calculate P&L based on position side
        let pnl;
        if (openPos.side === 'LONG') {
          pnl = (exitPrice - openPos.entry_price) * openPos.size;  // Long: profit when price goes up
        } else {
          pnl = (openPos.entry_price - exitPrice) * openPos.size;  // Short: profit when price goes down
        }
        const pnlNet = pnl - commission;  // Net P&L after commission
        equity += pnlNet;  // Update equity

        trades.push({
          entry_time: openPos.entry_time,
          exit_time: nextDt,
          entry_price: openPos.entry_price,
          exit_price: exitPrice,
          side: openPos.side,  // Record position side
          size: openPos.size,
          pnl: pnlNet,
          reason
        });
        openPos = null;  // Close position
      }
    }
  }

  // Force close any remaining open position at end of data
  if (openPos) {
    const lastOfDay = signals.filter(s => dayjs(s.dt).isSame(dayjs(openPos.entry_time), 'day')).slice(-1)[0];
    const slippageAdjust = openPos.side === 'LONG' ? -1 : 1;
    const exitPrice = lastOfDay.Close * (1 + slippageAdjust * (options.slippage_pct || 0.0003));

    // Calculate P&L based on position side
    let pnl;
    if (openPos.side === 'LONG') {
      pnl = (exitPrice - openPos.entry_price) * openPos.size;
    } else {
      pnl = (openPos.entry_price - exitPrice) * openPos.size;
    }
    const pnlNet = pnl - commission;
    equity += pnlNet;

    trades.push({
      entry_time: openPos.entry_time,
      exit_time: lastOfDay.dt,
      entry_price: openPos.entry_price,
      exit_price: exitPrice,
      side: openPos.side,
      size: openPos.size,
      pnl: pnlNet,
      reason: 'market_close_final'
    });
    openPos = null;
  }

  // Calculate performance statistics
  const stats = {
    trades: trades.length,
    total_pnl: trades.reduce((s, t) => s + t.pnl, 0),
    final_equity: equity,
    win_rate: trades.length ? trades.filter(t => t.pnl > 0).length / trades.length : 0,
    avg_win: trades.length ? trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / Math.max(1, trades.filter(t => t.pnl > 0).length) : 0,
    avg_loss: trades.length ? trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0) / Math.max(1, trades.filter(t => t.pnl < 0).length) : 0
  };
  return { trades, stats };
}

// ---------------- Grid search ----------------
/**
 * Parameter optimization via grid search
 * Tests all parameter combinations and returns performance for each
 * Used for finding optimal EMA periods, RSI thresholds, etc.
 * @param {Array} candles - Historical OHLCV data
 * @param {Array|null} htCandles - Higher timeframe data (optional)
 * @param {Array} paramGrid - Array of parameter objects to test
 * @returns {Array} Results for each parameter set with stats
 */
function gridSearch(candles, htCandles, paramGrid) {
  const results = [];
  // Test each parameter combination
  for (const params of paramGrid) {
    const signals = generateSignals(candles, params, htCandles);
    const { trades, stats } = backtestSameDay(signals, {
      market_open: MARKET_OPEN,
      market_close: MARKET_CLOSE,
      block_last_minutes: NO_ENTRY_BEFORE_CLOSE_MIN
    });
    results.push({ params, stats, trades_count: stats.trades });
  }
  return results;
}

// ---------------- CLI runner ----------------
/**
 * Main function - CLI entry point
 * Fetches historical data, runs backtest, and optionally places live/paper trades
 *
 * Usage examples:
 *   Paper mode: node kite.js --instrument 120395527 --days 10 --paper
 *   Live mode:  ENCTOKEN="xxx" node kite.js --instrument 120395527 --tradingsymbol GOLDM25FEBFUT
 */
async function main(argv = null) {
  // Parse command-line arguments
  if (!argv) {
    argv = process.argv.slice(2).reduce((acc, arg) => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        acc[key] = value === undefined ? true : value;
      }
      return acc;
    }, {});
  }
  const instrument = argv.instrument || argv.i;  // Instrument token (numeric ID)
  const days = Number(argv.days || 10);          // Days of historical data
  const interval = argv.interval || '2minute';   // Candle interval
  const paper = argv.paper || argv.p || false;   // Paper trading mode flag
  const refresh = argv.refresh || argv.r || false;  // Force refresh cache (ignore cached data)
  const noTimeExit = argv.notimeexit || argv.nte || false;  // Disable time-based exit (--notimeexit or --nte)

  // Get authentication token from env var, CLI arg, or auto-extract from Chrome
  let enctoken = process.env.ENCTOKEN || argv.enctoken;

  // Validation: enctoken required for live mode
  if (!enctoken && !paper) {
    console.error('enctoken is required unless running in paper mode. Set ENCTOKEN env var or pass --enctoken or use --profile to auto-extract.');
    process.exit(1);
  }

  // Validation: instrument token is mandatory
  if (!instrument) {
    console.error('instrument token required: --instrument <instrument_token>');
    process.exit(1);
  }

  // --- Live Trading Mode ---
  if (!paper) {
    console.log('--- LIVE TRADING MODE ACTIVATED ---');

    // 1. Weekend Check
    const today = dayjs();
    const dayOfWeek = today.day(); // Sunday = 0, Saturday = 6
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('Today is a weekend. Exiting live trading mode.');
      process.exit(0);
    }

    // 2. End-of-Day Exit Scheduler
    const marketCloseTime = dayjs().hour(23).minute(31).second(0);
    const msUntilClose = marketCloseTime.diff(today);
    
    if (msUntilClose > 0) {
      console.log(`Scheduled to exit automatically at ${marketCloseTime.format('HH:mm:ss')}`);
      setTimeout(() => {
        console.log('Market is closed. Exiting now.');
        process.exit(0);
      }, msUntilClose);
    }

    let isPositionOpen = false;

    // Start order monitor in the background to handle exits
    console.log('Starting persistent order monitor...');
    orderMonitorLoop(enctoken, 3000, () => false, false).catch(e => console.error('Order monitor stopped with error:', e));

    const liveTick = async () => {
      try {
        // 3. Market Hours Check
        const now = dayjs();
        const marketOpen = now.hour(9).minute(0);
        const marketClose = now.hour(23).minute(30);

        if (now.isBefore(marketOpen) || now.isAfter(marketClose)) {
          console.log(`Outside market hours. Current time: ${now.format('HH:mm:ss')}. Waiting...`);
          return;
        }

        // Check for open positions before attempting a new trade
        const positions = await fetchOpenOrders(enctoken);
        const openPositions = positions.filter(p => p.tradingsymbol === argv.tradingsymbol && p.quantity !== 0);
        isPositionOpen = openPositions.length > 0;

        if (isPositionOpen) {
          console.log(`Position already open for ${argv.tradingsymbol}. Skipping new trade check.`);
          return;
        }

        console.log(`\n[${dayjs().format('HH:mm:ss')}] Checking for new signals...`);
        
        // Fetch recent data (e.g., last 2 days) to ensure enough data for indicators
        const to = dayjs();
        const from = to.subtract(2, 'day');
        const raw = await fetchHistorical(enctoken, instrument, interval, from, to);

        if (!raw || raw.length === 0) {
          console.error('No bars returned for live tick.');
          return;
        }

        const signals = generateSignals(raw, { /* ... use live params ... */ });
        const lastSig = signals.slice(-1)[0];

        if (lastSig && (lastSig.signal === 1 || lastSig.signal === -1)) {
          const side = lastSig.signal === 1 ? 'BUY' : 'SELL';
          console.log(`>>> New Signal Detected: ${side} at ${lastSig.Close}`);
          
          const contracts = computeQuantity({
            capital: 450000,
            riskPct: 0.02,
            slTicks: 40,
            tickValuePerContract: 10
          });

          if (contracts >= 1) {
            console.log(`Placing ${side} order for ${contracts} contracts...`);
            await placeEntryWithSLTarget({
              enctoken,
              tradingsymbol: argv.tradingsymbol,
              exchange: 'MCX', // This should be dynamic
              side,
              contracts,
              slTicks: 40,
              targetTicks: 20,
              tickValue: 10,
              paperMode: false,
              lastLTP: lastSig.Close
            });
            isPositionOpen = true; // Assume position is open after placing order
          }
        } else {
          console.log('No new signal.');
        }
      } catch (error) {
        console.error('Error in live tick:', error.message);
      }
    };
    
    // Run the fist tick immediately, then start the interval
    liveTick();
    const intervalMinutes = parseInt(interval.replace('minute', '')) || 2;
    setInterval(liveTick, intervalMinutes * 60 * 1000);

    return; // Keep the process alive
  }

  // --- Backtesting / Paper-trading Mode ---
  console.log('--- BACKTEST / PAPER MODE ---');
  // Fetch historical data for backtesting (with caching support)
  const to = dayjs();
  const from = to.subtract(days, 'day');
  console.log(`Fetching historical ${instrument} from ${from.format()} to ${to.format()} interval ${interval}`);

  // Use cached data if available (unless --refresh flag is set)
  const raw = await fetchHistoricalCached(enctoken || '', instrument, interval, from, to, refresh);
  if (!raw || raw.length === 0) {
    console.error('No bars returned');
    process.exit(1);
  }
  console.log('Bars available:', raw.length);

  // Generate trading signals using technical indicators - SCALPING OPTIMIZED
  const signals = generateSignals(raw, {
    fast_ema: 12,
    slow_ema: 26,
    rsi_len: 14,
    vol_mult: 1.15,
    breakout_lookback: 20,
    atr_len: 14
  });

  // Run backtest on historical data
  const { trades, stats } = backtestSameDay(signals, {
    capital: 450000,
    sl_ticks: 30,
    target_ticks: 70,
    tick_value: 10,
    max_hold_candles: noTimeExit ? null : 60,
    risk_per_trade_pct: 0.014,
    commission_per_trade: 20,
    slippage_pct: 0.0001,
    market_open: MARKET_OPEN,
    market_close: MARKET_CLOSE,
    block_last_minutes: NO_ENTRY_BEFORE_CLOSE_MIN
  });
  console.log('\n=== BACKTEST RESULTS ===');
  console.log(`Trades: ${stats.trades}`);
  console.log(`Win Rate: ${(stats.win_rate * 100).toFixed(2)}%`);
  console.log(`Total P&L: ₹${stats.total_pnl.toFixed(2)}`);
  console.log(`Final Equity: ₹${stats.final_equity.toFixed(2)}`);
  console.log(`Avg Win: ₹${stats.avg_win.toFixed(2)}`);
  console.log(`Avg Loss: ₹${stats.avg_loss.toFixed(2)}`);
  console.log(`Profit Factor: ${stats.avg_win && stats.avg_loss ? (Math.abs(stats.avg_win / stats.avg_loss)).toFixed(2) : 'N/A'}`);

  // Save backtest results to file for API access
  const resultsFile = path.join(__dirname, 'backtest_results.json');
  const backtestResults = {
    timestamp: new Date().toISOString(),
    instrument: instrument,
    tradingsymbol: argv.tradingsymbol || 'UNKNOWN',
    interval: interval,
    days: days,
    trades: stats.trades,
    winningTrades: trades.filter(t => t.pnl > 0).length,
    losingTrades: trades.filter(t => t.pnl < 0).length,
    winRate: (stats.win_rate * 100).toFixed(2),
    totalPnL: stats.total_pnl,
    finalEquity: stats.final_equity,
    avgWin: stats.avg_win,
    avgLoss: stats.avg_loss,
    profitFactor: stats.avg_win && stats.avg_loss ? Math.abs(stats.avg_win / stats.avg_loss) : 0,
    exitReasons: trades.reduce((acc, t) => { acc[t.reason] = (acc[t.reason] || 0) + 1; return acc; }, {}),
    signalAnalysis: {
      total: signals.filter(s => s.signal !== 0).length,
      buy: signals.filter(s => s.signal === 1).length,
      sell: signals.filter(s => s.signal === -1).length,
      frequency: signals.filter(s => s.signal !== 0).length/signals.length
    },
    parameters: {
      capital: 450000,
      sl_ticks: 30,
      target_ticks: 70,
      risk_per_trade_pct: 0.014,
      max_hold_candles: noTimeExit ? null : 60
    }
  };

  try {
    fs.writeFileSync(resultsFile, JSON.stringify(backtestResults, null, 2));
    console.log(`\n✓ Backtest results saved to ${resultsFile}`);
  } catch (err) {
    console.error(`Failed to save backtest results: ${err.message}`);
  }
}

// Execute main function if this file is run directly (not imported as module)
if (require.main === module) {
  main().catch(e => {
    console.error(e);
    process.exit(1);  // Exit with error code on failure
  });
}

module.exports = {
  fetchHistorical,
  generateSignals,
  backtestSameDay,
  placeEntryWithSLTarget,
  fetchOpenOrders,
  cancelOrder,
  orderMonitorLoop,
  main
};

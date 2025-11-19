# Project Context: Kite Trading Bot

This document provides a summary of the Kite Trading Bot project based on the analysis of all markdown files at the root of the project.

## Core Functionality

The project is a trading bot for the Zerodha Kite platform. It uses a strategy based on a combination of technical indicators:

*   **EMA (Exponential Moving Average):** 12 and 26 periods.
*   **MACD (Moving Average Convergence Divergence):** 12, 26, and 9 periods.
*   **RSI (Relative Strength Index):** 14 periods.

The bot can be run in two modes:

*   **Paper Trading:** For testing the strategy without real money.
*   **Live Trading:** For executing trades with real money.

## REST API

A comprehensive REST API has been built using Express.js to provide remote control and monitoring of the trading bot. Key features of the API include:

*   **Health and Status:** Endpoints to check the health of the API server and the status of the trading process.
*   **Trading Control:** Endpoints to start, stop, and restart the trading process with customizable parameters.
*   **Enctoken Management:** Endpoints to update the daily enctoken and check its validity. A key feature is the ability to automatically log in to Kite and fetch the enctoken using user credentials and a 2FA code.
*   **Logs Management:** Endpoints to fetch recent logs, download the complete log file, and clear logs.
*   **Backtesting:** Endpoints to run backtests on historical data and get the results.
*   **Cache Management:** Endpoints to list and clear cached historical data.

## Mobile App

A native mobile app for Android has been developed using React Native and Expo. The app provides a user-friendly interface to interact with the bot's API. Key features of the mobile app include:

*   **Dashboard:** Real-time monitoring of trading status and other metrics.
*   **Trading Controls:** Start, stop, and configure trading parameters.
*   **Backtesting:** Run backtests and view results.
*   **Logs Viewer:** View and filter logs in real-time.
*   **Settings:** Manage enctoken, email alerts, and other configurations.
*   **Secure Storage:** Uses Expo SecureStore for encrypted storage of credentials.

## Deployment

The project is designed for deployment using Docker. There are detailed guides for:

*   **Local Deployment:** Running the bot and API server on a local machine.
*   **Cloud Deployment:** Deploying to a cloud server, with a specific guide for Oracle Cloud Free Tier.

## Security

A security audit was conducted, and numerous security enhancements have been implemented, including:

*   **API Key Authentication:** All API endpoints are protected by an API key.
*   **HTTPS Enforcement:** The API can be configured to enforce HTTPS in a production environment.
*   **Rate Limiting:** To prevent brute-force attacks and API abuse.
*   **Input Validation:** All user inputs are validated to prevent injection attacks.
*   **Log Sanitization:** Sensitive data is redacted from logs.
*   **File Permissions:** Secure file permissions are enforced for sensitive files.

## Build Process

The mobile app can be built in two ways:

*   **Local Build:** Without requiring an Expo account. This seems to be the user's preferred method.
*   **Cloud Build:** Using Expo's cloud build services (EAS), which requires a free Expo account.

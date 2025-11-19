#!/bin/bash
# Test script to demonstrate supervisor functionality

echo "🧪 Testing Supervisor Functionality"
echo "====================================="
echo ""

# Test 1: Missing enctoken
echo "Test 1: Running without ENCTOKEN (should fail)"
unset ENCTOKEN
timeout 5 node supervisor.js --instrument 120395527 --paper 2>&1 | head -20
echo ""
echo "✅ Test 1 complete (should show error)"
echo ""

# Test 2: With enctoken (paper mode)
echo "Test 2: Running with ENCTOKEN in paper mode"
export ENCTOKEN="dummy_token_for_testing_at_least_50_chars_long_xxxxxxxxxxxxxxxxxx"
timeout 10 node supervisor.js --instrument 120395527 --paper --notimeexit 2>&1 | head -30 &
SUPERVISOR_PID=$!

sleep 5
echo ""
echo "✅ Supervisor started (PID: $SUPERVISOR_PID)"
echo ""

# Show log file
if [ -f supervisor.log ]; then
    echo "📄 Recent supervisor.log entries:"
    tail -10 supervisor.log
fi

# Cleanup
echo ""
echo "🛑 Stopping supervisor..."
kill -TERM $SUPERVISOR_PID 2>/dev/null || true
sleep 2

echo ""
echo "✅ All tests complete!"

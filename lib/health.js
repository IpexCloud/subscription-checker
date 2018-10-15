const { createSubscriptionObservable } = require('./apollo')
const shortid = require('shortid')
const ERROR_TIMEOUT_SEC = 90
const RESUBSCRIBE_DELAY_SEC = 10

const init = (options) => {
    let errCount = 0
    let errLastReason = null

    const opts = {
        name: shortid.generate(),
        wsUrl: "",
        subscription: {},
        ...options
    }

    const subscriptionTimeout = () => setTimeout(() => {
        console.log(`[*${opts.name}*] No response from ${opts.wsUrl.replace(/wss:|\//g, "")}, handling as error...`)
        errCount += 1
        errLastReason = `No response from ${opts.wsUrl.replace(/wss:|\//g, "")}`
        // Restart subscription timer            
        subscriptionTimeout()
    }, 1000 * ERROR_TIMEOUT_SEC)

    console.log(`[*DIAG*] Creating observer for ${opts.name}...`)
    const subscriptionObserver = createSubscriptionObservable(opts.wsUrl, opts.subscription)
    // Start subscription checking timeout
    let timeout = subscriptionTimeout()
    // Cover subscription func with another function for implementing resubscribing
    // TODO : find better alternative
    const runSubscription = () => {
        subscriptionObserver.subscribe(data => {
            if (!data.errors) {
                console.log(`[*${opts.name}*] Data fetched (${new Date(Date.now())}), restarting timer...`)
                errCount = 0
                clearTimeout(timeout)
                timeout = subscriptionTimeout()
            } else {
                console.log(`[*${opts.name}*] Error occured: ${data.errors[0].message}`)
                errCount += 1
                errLastReason = data.errors[0].message
                clearTimeout(timeout)
                // Do resubscribe with timeout
                setTimeout(runSubscription, 1000 * RESUBSCRIBE_DELAY_SEC)
            }
        }, err => {
            console.log(`[*${opts.name}*] Error occured: ${err.message}`)
            errCount += 1
            errLastReason = err.message
            // Force close connection and reconnect
            subscriptionObserver.wsClient.close(true)
            subscriptionObserver.wsClient.connect()
        })
    }

    runSubscription()

    return {
        status: () => ({
            status: errCount < 3 ? "OK" : "FAIL",
            message: errCount < 3 ? "OK" : errLastReason
        })
    }
}

module.exports = { init }
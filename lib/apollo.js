const { execute } = require('apollo-link')
const { WebSocketLink } = require('apollo-link-ws')
const { SubscriptionClient } = require('subscriptions-transport-ws')
const { getToken } = require('./login')
const webSocket = require('ws')
const shortid = require('shortid')

const getWsClient = (wsUrl) => {
    const client = new SubscriptionClient(
        wsUrl,
        {
            reconnect: true,
            connectionParams: async () => {
                try {
                    const token = await getToken()
                    console.log(`[*DIAG*] Obtained user token: ${token.substring(0,50)}...`)
                    return {
                        authToken: token,
                        correlationId: shortid.generate()
                    }
                } catch(err) {
                    console.log(`[*DIAG*] Wrong token - ${wsUrl.replace(/wss:|\//g, "")}`)
                    client.close(false)
                }
            },
        },
        webSocket
    )
    return client
}



const createSubscriptionObservable = (wsUrl, query, variables) => {
    const wsClient = getWsClient(wsUrl)
    const events = ['connecting', 'connected', 'reconnecting', 'reconnected', 'disconnected']
    events.map(event => wsClient.on(event, () => {
        console.log(`[*DIAG*] Socket ${event} - ${wsUrl.replace(/wss:|\//g, "")}...`)
    }))
    
    return {
        subscribe: (...args) => execute(new WebSocketLink(wsClient), { query, variables }).subscribe(...args),
        wsClient
    } 
    
}

module.exports = { createSubscriptionObservable }
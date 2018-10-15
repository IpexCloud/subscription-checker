const micro = require('micro')
const query = require('micro-query')

const checkHealth = require('./lib/health')
const { IPBX_SUBSCRIPTION } = require('./lib/subscriptionQueries')
const PORT = process.env.PORT || 3000

const apiServers = [
    {
        name: "ipbx",
        wsUrl: 'wss://ipbxapi-dev.voipex.io',
        subscription: IPBX_SUBSCRIPTION,
    },
    // {
    //     name: "meetings",
    //     wsUrl: 'wss://meeting-devel.voipex.io',
    //     subscription: ?
    // }
]

console.log(`>> Starting subscription diagnostic microservice at ${PORT}`)
const mappedServers = apiServers.reduce((acc, cur) => {
    acc[cur.name] = checkHealth.init(cur)
    return acc
},{})

const server = micro(async (req,res) => {
    if (req.method === 'GET' && req.url.startsWith('/health')) {
        const serverQuery = query(req).server
        if (mappedServers[serverQuery]) {
            const health = mappedServers[serverQuery].status()
            micro.send(res, 200, {
                name: 'subscription',
                status: health.status,
                message: health.message
            })
        } else {
            micro.send(res, 200, {
                name: 'subscription',
                health: Object.keys(mappedServers).map(el => ({server: el, ...mappedServers[el].status()}))
            })
        }
        
    } else {
        micro.send(res, 404, 'Not found')
    }
})

server.listen(PORT)
const gql = require('graphql-tag')

const IPBX_SUBSCRIPTION = gql`
    subscription {
        heartbeat {
            time
        }
    }
`
module.exports = { IPBX_SUBSCRIPTION }
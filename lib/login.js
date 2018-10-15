const axios = require('axios')

const getToken = async () => {
    try {
        const { data } = await axios.post('https://restapi-devel.ipex.cz/v1/sso/login', {
            email: process.env.USER_EMAIL,
            password: process.env.USER_PASSWORD
        })
        return data.access_token
    } catch(err) {
        throw new Error(err)
    }
}

module.exports = { getToken }
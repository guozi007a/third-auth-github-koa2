const router = require('koa-router')()
const axios = require('axios')
const querystring = require('querystring')

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.get('/string', async (ctx, next) => {
  ctx.body = 'koa2 string'
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})

const client_id = '95a6cf45f087a9b6dbe2'
const client_secret = '7efaeec759e2eede82a05d37dd1c33196443c9f8'
const redirect_uri = 'http://localhost:3001/callback/github'
const homePage = 'http://localhost:3001'
const maxAge = 7 * 24 * 60 * 60 * 1000 // 7天有效期

// 登录重定向
router.get('/login/github', async (ctx, next) => {
    console.log('开始重定向进入验证...')
    const path = `https://github.com/login/oauth/authorize?scope=user&client_id=${client_id}&state=big_deal&redirect_uri=${redirect_uri}`
    ctx.redirect(path)
})

router.get('/callback/github', async (ctx, next) => {
    // 点击登录，开始跳转，获取生成的code
    const { code, state } = ctx.query
    if (state !== 'big_deal') return
    
    const params = {
        client_id,
        client_secret,
        code,
    }

    // 使用code置换access_token
    const res_token = await axios.post('https://github.com/login/oauth/access_token', params)
    const { access_token, token_type } = querystring.parse(res_token.data)

    // 通过token获取用户信息
    const res_user = await axios({
        method: 'get',
        url: 'https://api.github.com/user',
        headers: {
            'Authorization': `${token_type} ${access_token}`,
        }
    })

    console.log('data: ', res_user.data)

    let info = ctx.cookies.get('UI_USER_INFO')
    if (!info) {
        info = JSON.stringify({
            userId: res_user.data.id,
            nickname: res_user.data.login,
            avatarUrl: res_user.data.avatar_url,
        })
        const cookieConfig = {
            maxAge,
            httpOnly: false,
        }
        ctx.cookies.set('UI_USER_INFO', info, cookieConfig)
    }

    ctx.redirect(homePage)
})

module.exports = router

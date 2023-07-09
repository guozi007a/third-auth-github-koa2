# 第三方登录验证-github

## 依赖
```js
koa2-cors： 用于处理跨域
querystring: 用于解析字符串，获取对应字段
axois：用于发起请求
```

## 前端登录按钮

```jsx
<a href="/login/github">Github登录</a>
```

## 重定向到认证页

后端接收到`/login/github`请求，重定向到第三方认证

```js
router.get('/login/github', async (ctx, next) => {
    console.log('开始重定向进入验证...')
    const path = `https://github.com/login/oauth/authorize?scope=user&client_id=${client_id}&state=big_deal&redirect_uri=${redirect_uri}`
    ctx.redirect(path)
})
```

## 处理登录验证

到认证页后，接收到带上的`client_id`，页面会跳转到回调页`/callback/github?code=xxx`。此时后端接收到请求，获取到`code`。

## code置换access_token

通过`code`参数，以及`cliend_id`和`client_secret`参数，向`https://github.com/login/oauth/access_token`发起`post`请求，获取`access_token`。

```js
const params = {
    client_id,
    client_secret,
    code,
}

// 使用code置换access_token
const res_token = await axios.post('https://github.com/login/oauth/access_token', params)
// querystring库解析字符串，获取到对应字段
const { access_token, token_type } = querystring.parse(res_token.data)
```


## 获取用户信息

向`https://api.github.com/user`发起`get`请求，带上`access_toekn`参数，获取用户信息。这里需要注意的是，参数并不是拼接到请求地址里，而是放在`header`里。

```js
const res_user = await axios({
    method: 'get',
    url: 'https://api.github.com/user',
    headers: {
        'Authorization': `${token_type} ${access_token}`,
    }
})

console.log('data: ', res_user.data)
```

## 处理用户信息

此时，可以将用户信息以`cookie`的形式返回给前端，并重定向到前端项目首页。

还可以加入`token`，将`token`返回给前端。
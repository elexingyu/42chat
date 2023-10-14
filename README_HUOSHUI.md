# 说明文件

## 开发环境准备

```
# 安装环境
yarn install

# 本地启动
yarn dev
```

## 生产环境部署说明

生产环境是部署在vercel。

目前有两个分支：dev和main，dev用于开发测试，main用于部署生产。

vercel监控 main 分支，当有代码推送到 main 时，生产环境会自动拉取最新代码部署。

有以下域名使用到这个项目

1. https://vip.42share.io/
2. https://pro.42share.io/
3. https://42chat.io/

### 注意事项

vercel会使用`yarn run build`命令进行部署，因此需要确保本地可执行这个命令，如果命令执行出错，则生产环境会部署失败，部署失败不影响生产环境。

可以在 https://github.com/luoyuanlong/ChatGPT-Next-Web/deployments 看到部署记录

在Deployment history中，带preview前缀的是预览；带production前缀的是生产，只有production发布，才会影响生产。另外提交dev分支会触发preview。

### 可能部署失败的情况

1、生产环境部署失败原因一

`yarn dev`本地可以运行，但是由于`package.json`丢失依赖，`yarn run build`执行失败，于是推送后部署失败。

解决方案：让`yarn run build`执行成功即可。

## 如何拉取最新代码

1、切换到dev分支

```
git checkout dev
```

2、执行下面命令，从官方仓库拉取最新代码

```
git pull https://github.com/Yidadaa/ChatGPT-Next-Web.git
```

3、检查并合并代码

4、测试没问题后，合并到main，push并部署到生产环境

## 登录功能

我们私加了一个帐号登录功能，其实是设置里的【访问密码】的另一种形式，并没有相关后端接口和用户数据库。

拼接方式为：`{username}+{password}=访问码`

具体参见代码：app\components\login-model.tsx

访问密码在部署的时候配置，写死在`.env`文件里。`.env`一般不push

## 修改功能

1、修改分享到 ShareGPT 的功能，改为 42Share

操作：查找代码中所有 ShareGPT 字段，改为 42Share

2、注释掉 分享到 42Share 按钮

位置：app\components\exporter.tsx

3、修改对话太长会自动隐藏前面对话的特性

新版本似乎已经移除

## changelog

- 20231014：添加修改功能部分
- 20230616：添加部署注意事项
- 20230614：初稿

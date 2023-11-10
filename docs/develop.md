# Project Development

Flycat is a client-side software without introducing backends or database setup. the idea is to keep it effortless for users to self host. It mainly use React Nextjs framework in typescript lang.

## Branch

- `master` branch is the one for production development. Every commit merged in master branch will push new release alive.
- `develop` branch is only used for feature involved with tons of works and needs to be tested before release to production.

## How to run

`Nodejs >= v18.12.1` `yarn >= 1.22.19`

```sh
git clone https://github.com/digi-monkey/flycat-web.git --recurse-submodules

## run install script
cd flycat-web
./scripts/install.sh

# install packages
yarn

## development
yarn dev

## build for release
yarn build
```

For self-host, check out [How to deploy to vercel](https://nextjs.org/learn/basics/deploying-nextjs-app/deploy)

## Code structure

- TODO

## Release

Once a week, we release a regular update version. For hotfix, a instant minor version will be roll out once fixed.

We use [project kanban](https://github.com/users/digi-monkey/projects/1) to manage the development and release. every week, we gather the things we want to do in this kanban and release a new version at the end of that week.

## Contributing

A good way to start contributing is to check the [github issues](https://github.com/digi-monkey/flycat-web/issues) labeling with `good first issue`.

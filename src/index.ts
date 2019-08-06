import * as yargs from 'yargs'
import fetch from 'node-fetch';

const ethToWei = n => n * 1e18

const getAddr = (host: string, port: number) => (host ? host :
    'http://localhost') +
    (port ? ':' + port.toString() : '')

require('yargs')
    .scriptName('jolocom-cli')
    .wrap(yargs.terminalWidth())

    .command(
        'did',
        'get basic info about current identity',
        yargs => {
            yargs.usage('Usage: $0 did [options...]')
        },
        args => fetch(getAddr(args.host, args.port) + '/did', {
            method: 'get',
        })
            .then(res => res.json())
            .then(json => {
                console.log('did: ' + json.did)
                console.log('created: ' + json.date)
            })
    )

    .command(
        'validate <response>',
        'validate a response JWT',
        yargs => {
            yargs.usage('Usage: $0 validate <JWT> [options...]')
            yargs.positional('response', {
                description: '- JWT encoded response received from the client',
                type: 'string'
            })
        },
        args => fetch(getAddr(args.host, args.port) + '/validate', {
            method: 'post',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(json => {
                console.log('valid: ' + json.validity)
                console.log('did: ' + json.respondant)
            })
    )

    .command(
        'keycloak <credentialRequest>',
        'generate valid credential response for KeyCloak integration',
        yargs => {
            yargs.usage('Usage: $0 keycloak <JWT> [options...]')
            yargs.positional('credentialRequest', {
                description: '- JWT encoded credential request received from the backend',
                type: 'string'
            })
            yargs
                .option('name', {
                    alias: 'n',
                    description: "Value of the 'Name' credential",
                    default: 'Scooter'
                })
                .option('email', {
                    alias: 'e',
                    description: "Value of the 'Email' credential",
                    default: 'scooter@dflow.demo'
                })
        },
        args => fetch(getAddr(args.host, args.port) + '/response/keycloak', {
            method: 'post',
            body: JSON.stringify({
                attrs: {
                    callbackURL: args.callbackURL,
                    name: args.name,
                    email: args.email
                },
                request: args.request
            }),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.text())
            .then(console.log)
    )

    .command(
        'request',
        'generate a JWT encoded interaction request',
        yargs => {
            yargs.command(
                'auth <callbackURL> [description]',
                'generate JWT encoded authentication request',
                yargs => {
                    yargs.usage('Usage: $0 request auth <callbackURL> [description] [options...]')
                    yargs.positional('callbackURL', {
                        description: '- url to which the client should send the response',
                        type: 'string'
                    })

                    yargs.positional('description', {
                        description: '- additional description to render on the client device',
                        type: 'string'
                    })
                },
                args => fetch(getAddr(args.host, args.port) + '/request/authentication', {
                    method: 'post',
                    body: JSON.stringify({
                        callbackURL: args.callbackURL,
                        description: args.description
                    }),
                    headers: { 'Content-Type': 'application/json' }
                })
                    .then(res => res.text())
                    .then(console.log)
            )
            yargs.command(
                'payment <callbackURL> <description> <amount> [to]',
                'generate JWT encoded payment request',
                yargs => {
                    yargs.usage('Usage: $0 request payment <callbackURL> <description> <amount> [to] [options...]')
                    yargs.positional('callbackURL', {
                        description: '- url to which the client will send the response',
                        type: 'string'
                    })
                    yargs.positional('description', {
                        description: '- additional description to render on the client device',
                        type: 'string'
                    })
                    yargs.positional('amount', {
                        description: '- amount of Eth to transfer',
                        coerce: ethToWei,
                        type: 'number'
                    })
                    yargs.positional('to', {
                        description: '- receiver Ethereum address, defaults to current identity',
                        type: 'string'
                    })
                },
                args => fetch(getAddr(args.host, args.port) + '/request/payment', {
                    method: 'post',
                    body: JSON.stringify({
                        callbackURL: args.callbackURL,
                        description: args.description,
                        transactionOptions: {
                            value: args.amount,
                            to: args.to,
                        }
                    }),
                    headers: { 'Content-Type': 'application/json' }
                })
                    .then(res => res.text())
                    .then(console.log)
            )
        },
        () => { }
    )

    .command(
        'response',
        'generate a JWT encoded interaction response',
        yargs => {
            yargs.command(
                'auth <request> <callbackURL> [description]',
                'generate a JWT auth response to the request',
                yargs => {
                    yargs.usage('Usage: $0 response auth <request> <callbackURL> [description] [options...]')
                    yargs.positional('request', {
                        description: '- auth request to respond to',
                        type: 'string'
                    })

                    yargs.positional('callbackURL', {
                        description: '- url to which the client should send the response',
                        type: 'string'
                    })

                    yargs.positional('description', {
                        description: '- additional description to render on the client device',
                        type: 'string'
                    })
                },
                args => fetch(getAddr(args.host, args.port) + '/response/authentication', {
                    method: 'post',
                    body: JSON.stringify({
                        request: args.request,
                        attrs: {
                            callbackURL: args.callbackURL,
                            description: args.description
                        }
                    }),
                    headers: { 'Content-Type': 'application/json' }
                })
                    .then(res => res.text())
                    .then(console.log)
            )
        },
        () => { }
    )

    .option('host', {
        alias: 'h',
        description: 'Set the host for the identity server',
        type: 'string',
        default: 'http://localhost'
    })

    .option('port', {
        alias: 'p',
        description: 'Set the port to access for the identity server',
        type: 'number',
        default: 3000
    }).argv

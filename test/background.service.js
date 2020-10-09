onmessage = event =>
{
    switch (event.data.action)
    {
        case 'start':

            postMessage({ info: 'starting background service test' })

            setInterval(() =>
            {
                postMessage({ value: new Date().getTime().toString(36) })

            }, 700)

            break

        case 'stop':

            postMessage({ info: 'background service stopped' })

            break
    }
}
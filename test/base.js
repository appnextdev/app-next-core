function error()
{
    const error = new Error('Test error listener')

    error.name = 'test'; return error
}

function wait(interval, criteria)
{
    return new Promise(resolve =>
    {
        setTimeout(() => 
        {
            const result = criteria()

            if (result) resolve(result)

        }, interval)
    })
}

function notify(id, ok)
{
    update(id, ok ? 'ok' : 'ko')
}

function update(id, classes)
{
    wait(500, () => document.getElementById(id)).then(element =>
    {
        element.classList.add(classes)
    })
}
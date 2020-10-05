this.AppNext = function(events)
{
    const imports = ['core', 'setup'].map(name => System.import(name))

    Promise.all(imports).then(modules =>
    {
        if (events instanceof Function)
        {
            events = 
            {
                onData: events
            }
        }

        const core = new modules[0].AppNextCore(events),
              setup = new modules[1].AppNextSetup()

        core.elements = setup.elements
        core.register = setup.register
        core.services = setup.services

        core.CustomElement = core.elements.CustomElement

        core.render = elements => setup.render(elements)

        core.start().then(() => {})
    })
}
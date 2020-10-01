this.AppNext = function(invoke)
{
    const imports = ['core', 'setup'].map(name => System.import(name))

    Promise.all(imports).then(modules =>
    {
        const core = new modules[0].AppNextCore(),
              setup = new modules[1].AppNextSetup()

        core.elements = setup.elements
        core.register = setup.register
        core.services = setup.services

        core.CustomElement = core.elements.CustomElement

        core.render = elements => setup.render(elements)

        invoke(core)
    })
}
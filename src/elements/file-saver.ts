import { AppNextCustomElement } from './base'
import { error, Errors } from '../handlers/error'

interface AppNextFileSaverData
{
    data: string
    name: string
    size: number
    type: string
}

export class AppNextFileSaver extends AppNextCustomElement<AppNextFileSaverData>
{
    public render()
    {
        const config = this.utils.config(),
              target = 'a'

        this.utils.reset()

        this.events.onCancel = config.oncancel

        if (!this.utils.support.attribute(target, 'download')) 
        {
            return this.events.invokeCancelEvent(error(Errors.downloadNotSupported))
        }

        if (!(config.data instanceof Function))
        {
            return this.events.invokeCancelEvent(error(Errors.invalidConfig))
        }
        
        try
        {
            const element = this.utils.element(target) as any,
                  data = config.data.call(config),
                  label = this.utils.attribute('label') || 'Save',
                  name = this.utils.attribute('name') || new Date().getTime().toString(36),
                  type = this.utils.attribute('type') || 'application/octet-stream'
                  
            this.events.onError = config.onerror
            this.events.onData = config.onsave
            this.events.onReady = config.onready
            
            element.download = name
            element.href = 'data:' + type + ',' + encodeURIComponent(data)
            element.innerText = label

            element.onclick = element.ontouchend = () =>
            {
                this.events.invokeDataEvent({ data, name, type, size: (new TextEncoder().encode(data)).length })
            }
            
            this.events.invokeReadyEvent()
        }
        catch (error)
        {
            this.events.invokeErrorEvent(error)
        }
    }
}
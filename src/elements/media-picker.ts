import { AppNextCustomElement } from './base'
import { error, Errors } from '../handlers/error'

export class AppNextMediaPicker extends AppNextCustomElement<FileList>
{
    public render()
    {
        this.utils.reset()

        const target = 'input',
              config = this.utils.config(),
              element = this.utils.element(target) as HTMLInputElement,
              type = this.utils.attribute('type'),
              single = this.utils.attribute('single'),
              source = this.utils.attribute('source')

        this.events.onCancel = config.oncancel
        this.events.onData = config.onmedia
        this.events.onError = config.onerror
        this.events.onReady = config.onready

        try
        {
            if (source)
            {
                if (this.utils.support.attribute(target, 'capture'))
                {
                    (element as any).capture = source == 'auto' ? '' : source
                }
                else
                {
                    this.events.invokeCancelEvent(error(Errors.captureNotSupported))
                }
            }
    
            if (type)
            {
                if (this.utils.support.attribute(target, 'accept'))
                {
                    element.accept = type + '/*'
                }
                else
                {
                    this.events.invokeCancelEvent(error(Errors.acceptNotSupported))
                }
            }

            element.multiple = single == null || single == undefined || single != ''
            element.onchange = () => this.events.invokeDataEvent(element.files)
            element.type = 'file'

            this.events.invokeReadyEvent()
        }
        catch (error)
        {
            this.events.invokeErrorEvent(error)
        }
    }
}
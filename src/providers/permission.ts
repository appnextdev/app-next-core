import { AppNextDataEvents } from '../handlers/data'
import { Errors, error } from '../handlers/error'

export class AppNextPermissionProvider extends AppNextDataEvents<void>
{
    constructor(name: PermissionName)
    {
        super()

        this.name = name
    }

    private readonly name: PermissionName

    public register() : Promise<void>
    {
        function handlePermission(permission: PermissionStatus)
        {
            try
            {
                switch (permission.state)
                {
                    case 'granted': return provider.invokeReadyEvent()
                    case 'prompt': return provider.invokePendingEvent()
                    case 'denied': return provider.invokeCancelEvent(error(Errors.permissionDenied))
                }
            }
            catch (error)
            {
                provider.invokeErrorEvent(error)
            }
        }

        const provider = this

        return navigator.permissions.query({ name: this.name }).then(permission =>
        {
            handlePermission(permission)
            permission.onchange = () => handlePermission(permission)
        })
    }
}
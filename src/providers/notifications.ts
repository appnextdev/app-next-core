import { AppNextWatch } from '../handlers/watch'
import { Errors, error } from '../handlers/error'
import { AppNextDataEvents, AppNextDataEventsListeners } from '../handlers/data'

export class AppNextNotificationsProvider extends AppNextWatch<Notification>
{
    constructor()
    {
        super('notifications')

        this.notifications = []
    }

    private active: boolean
    private readonly notifications: Array<Notification>

    public create(title: string, listeners: AppNextDataEventsListeners<Event>, options?: NotificationOptions) : void
    {
        if (!this.active) return

        const events = AppNextDataEvents.from(listeners),
              notification = new Notification(title, options)

        notification.onclose = () => events.invokeCancelEvent(error(Errors.featureTerminated))
        notification.onerror = () => events.invokeErrorEvent(error(Errors.notificationError))
        notification.onclick = event => events.invokeDataEvent(event)
        notification.onshow = () => events.invokeReadyEvent()

        this.notifications.push(notification)
        
        events.invokePendingEvent(); this.invokeDataEvent(notification)
    }

    public start() : void
    {
        this.active = true

        this.invokeReadyEvent()
    }

    public stop() : void
    {
        this.active = false

        try
        {
            this.notifications.forEach(notification => notification.close())

            this.notifications.splice(0, this.notifications.length)

            this.invokeCancelEvent(error(Errors.featureTerminated))
        }
        catch(error)
        {
            this.invokeErrorEvent(error)
        }
    }
}
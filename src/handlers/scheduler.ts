import { AppNextBackgroundService } from './background'

export interface AppNextScheduledTask
{
    context?: any
    when: Date
    what: () => void
}

export class AppNextScheduler extends AppNextBackgroundService
{
    constructor(seconds: number = 1)
    {
        super
        (`
            function handleError(error)
            {
                throw error
            }

            const tasks = []

            setInterval(() =>
            {
                const count = tasks.length,
                      now = new Date().getTime()
    
                for (let i = 0; i < count; i++)
                {
                    const task = tasks.shift()

                    try
                    {
                        if (now > task.when)
                        {
                            postMessage(task)
                        }
                        else
                        {
                            tasks.push(task)
                        }
                    }
                    catch(error)
                    {
                        handleError(error)
                    }
                }

            }, ${seconds * 1000})

            onmessage = event =>
            {
                try
                {
                    const task = event.data

                    if (!(task.when instanceof Date) || !(task.key))
                    {
                        const error = new Error('Invalid task object')

                        error.name = 'invalid task'; handleError(error)
                    }

                    task.when.setMilliseconds(0)
                    task.when = task.when.getTime()
                    tasks.push(task)
                }
                catch(error)
                {
                    handleError(error)
                }
            }
        `)

        this.tasks = {}

        this.onData = event =>
        {
            const task = this.tasks[event.data.key]; if (!task) return

            task.what.call(task.context || {}); this.invokeExecuteEvent(task)
        }
    }

    private execute: (task: AppNextScheduledTask) => void
    private register: (task: AppNextScheduledTask) => void
    private readonly tasks: Record<string, AppNextScheduledTask>

    public set onExecute(listener: (task: AppNextScheduledTask) => void) { this.execute = listener }
    public set onRegister(listener: (task: AppNextScheduledTask) => void) { this.register = listener }

    private invokeExecuteEvent(task: AppNextScheduledTask)
    {
        if (this.execute) this.execute(task)
    }

    private invokeRegisterEvent(task: AppNextScheduledTask)
    {
        if (this.register) this.register(task)
    }

    public post(task: AppNextScheduledTask) : boolean
    {
        try
        {
            const key = new Date().getTime().toString(36)

            this.tasks[key] = task
    
            super.post({ key, when: task.when })
    
            this.invokeRegisterEvent(task)
    
            return true
        }
        catch(error)
        {
            this.invokeErrorEvent(error)

            return false
        }
    }
}
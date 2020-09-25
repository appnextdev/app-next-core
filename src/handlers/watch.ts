import { AppNextDataEvents } from './data';

export abstract class AppNextWatch<T> extends AppNextDataEvents<T>
{
    protected id: number

    public abstract request() : Promise<void>
    public abstract start() : void
    public abstract stop() : void
}
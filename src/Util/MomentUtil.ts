import * as Moment from 'moment';

export const runDateToMoment = (targetDate: Date, dateString: string): Moment.Moment => {
    const hhmm = dateString.split(':');
    const hh = parseInt(hhmm[0], 10);
    const mm = parseInt(hhmm[1], 10);

    return Moment(targetDate).startOf('day').hour(hh).minute(mm);
}

import { DataTypes, Sequelize } from 'sequelize';
import { Agent } from './agent';

const cwd = process.cwd();

export const db = new Sequelize({
    'dialect': 'sqlite',
    'storage': `${cwd}/database.sqlite`,
    'sync': { 'force': true }
});

export const init = (): void => {
    /*
    db.define('Agent', {
        'id': {
            'autoIncrement': true,
            'primaryKey': true,
            'type': DataTypes.INTEGER
        },
        'ipaddress': {
            'allowNull': false,
            // tslint:disable-next-line:no-magic-numbers
            'type': DataTypes.STRING(8)
        },
        'name': {
            'allowNull': false,
            'type': DataTypes.TEXT
        },
        'sharekey': {
            'allowNull': false,
            'type': DataTypes.TEXT
        }
    });
    */

    Agent.init(
        {
            'ipaddress': {
                'allowNull': false,
                // tslint:disable-next-line:no-magic-numbers
                'type': DataTypes.STRING(8)
            },
            'name': {
                'allowNull': false,
                'type': DataTypes.TEXT
            },
            'sharekey': {
                'allowNull': false,
                'type': DataTypes.TEXT
            }
        },
        {
            'sequelize': db,
            'modelName': 'Agent'
        }
    );

}
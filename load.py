import os
import sys
import psycopg2
import ConfigParser

import pandas as pd
import numpy as np


BASE_DIR = os.path.abspath('.')
DATA_DIR = os.path.join(BASE_DIR, 'public/data')


class PGCreator():
    def __init__(self, fpath, tablename):
        self.table = tablename
        self.df = pd.read_csv(fpath)
        self.data_map = {
            np.dtype('O'): "VARCHAR",
            np.dtype('int64'): "INT",
            np.dtype('float64'): "DECIMAL",
            np.dtype('datetime64'): "DATE"
        }


    def _create_str(self):
        header_zip = self._get_pg_header()
        start_str = "CREATE TABLE {} (".format(self.table)
        end_str = ""
        for i in header_zip:
            end_str += "{} {}, ".format(i[0], i[1])
        end_str = end_str[:-2] + ');'
        return start_str + end_str


    def _get_pg_header(self):
        data_types = self.df.dtypes.tolist()
        pg_dtypes = []
        for i in data_types:
            rs_type = self.data_map[i]
            pg_dtypes.append(rs_type)
        col_names = self.df.columns.values.tolist()
        bad_chars = ['(', ')', '.', '/']
        col_headers = []
        for col in col_names:
            for char in bad_chars:
                if char in col:
                    col = col.replace(char, '')
            col = col.replace(' ', '_').lower()
            col = col.replace('-', '_')
            col_headers.append(col)
        return zip(col_headers, pg_dtypes)


    def _mogrify_str(self):
        mogrify = ''
        for i in range(self.df.shape[1]):
            mogrify += '%s, '
        return '(' + mogrify[:-2] + ')'


    def _get_conn(self):
        Config = ConfigParser.ConfigParser()
        Config.read('pg.ini')
        db_name = 'postgres'
        config = {'dbname': Config.get(db_name, 'dbname'),
            'user': Config.get(db_name, 'user'),
            'pwd': Config.get(db_name, 'password'),
            'host': Config.get(db_name, 'host'),
            'port': Config.get(db_name, 'port')
        }

        conn = psycopg2.connect(dbname=config['dbname'], host=config['host'],
            port=config['port'], user=config['user'], password=config['pwd'])
        cur = conn.cursor()
        return cur, conn


    def create_table(self):
        create_str = self._create_str()
        cur, conn = self._get_conn()
        cur.execute(create_str)
        conn.commit()
        cur.close()
        conn.close()


    def insert_data(self):
        cur, conn = self._get_conn()
        mog = self._mogrify_str()
        args_str = ",".join(cur.mogrify(mog,
            [i for i in x.tolist()]) for x in self.df.values)
        cur.execute("INSERT INTO {table} values {args}".format(
            table=self.table, args=args_str))
        conn.commit()
        cur.close()
        conn.close()


def main():
    fname = 'raw_data.csv'
    tablename = 'football.test'
    fpath = os.path.join(DATA_DIR, fname)
    pgcreate = PGCreator(fpath, tablename)
    print("Creating Table")
    pgcreate.create_table()
    print("Inserting Data")
    pgcreate.insert_data()


if __name__ == '__main__':
    main()

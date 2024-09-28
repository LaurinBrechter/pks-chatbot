'use client'

import { createTable, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"


export default function QueryResults({ data, query }: { data: any[], query: string }) {
    
    const columns = React.useMemo(() => {
        if (data.length === 0) return [];
        return Object.keys(data[0]).map((key) => ({
            accessorKey: key,
            header: key,
        }));
    }, [data]);

    // Create the table instance
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Query Results</CardTitle>
                <CardDescription>{query}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
                <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}</TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map(row => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
    )
}
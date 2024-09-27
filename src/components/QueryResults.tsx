import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";



export default function QueryResults({ data, query }: { data: any, query: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Query Results</CardTitle>
                <CardDescription>{query}</CardDescription>
            </CardHeader>
            <CardContent>
                <pre>{JSON.stringify(data, null, 2)}</pre>
            </CardContent>
        </Card>
    )
}
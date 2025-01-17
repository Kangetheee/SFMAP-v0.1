import { FileSearch2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AreaVariant } from "./area-variant";

type Props = {
    data?: {
        date: string;
        income: number; 
        expenses: number;
    }[];
};

// npm i recharts --legacy-peer-deps

export const Chart = ({ data=[]}: Props) =>{
    return(
        <Card className="border-none drop-shadow-sm" >
            <CardHeader className="flex space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
                <CardTitle className="text-xl line-clamp-1">Transactions</CardTitle>
                {/* TODO: Add Select */}
            </CardHeader>
            <CardContent>
                {
                    data.length === 0 ? (
                        <div className="flex flex-col gap-y-4 items-center justify-center h-[350px] w-full">
                            <FileSearch2 className="text-muted-foreground"/>
                            <p className="text-muted-foreground text-sm">No Data for this Period</p>
                        </div>
                    ) : (
                        <AreaVariant data={data}/>
                    )}
            </CardContent>
        </Card>
    )
}
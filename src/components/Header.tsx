import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BadgeInfo } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full h-16 border p-5 flex items-center justify-between sticky top-0 z-10 bg-white">
      <div>
      <h1>PKS Interactive</h1>
      <p className="text-gray-500">Interactively explore the German police crime statistics</p>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="flex gap-2"><BadgeInfo />More Information</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>More Information</SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when you're done.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit">Save changes</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </header>
  );
}

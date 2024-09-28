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
    <header className="w-full h-20 border p-5 flex items-center justify-between">
      <h1>PKS Interactive</h1>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="flex gap-2"><BadgeInfo />Mehr Informationen</Button>
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

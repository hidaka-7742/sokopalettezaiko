"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SHELF_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
const SHELF_LEVELS = [1, 2, 3];

export function Shelves() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {SHELF_LETTERS.map((letter) => (
        <Card key={letter}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">棚 {letter}</h3>
                <Button variant="outline" size="sm">
                  詳細
                </Button>
              </div>
              
              {SHELF_LEVELS.map((level) => (
                <div key={level} className="space-y-2">
                  <Label>レベル {level}</Label>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="商品を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prd001">プレミアムコーヒー豆</SelectItem>
                        <SelectItem value="prd002">オーガニック紅茶</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="数量" className="w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
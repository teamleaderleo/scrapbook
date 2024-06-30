/**
 * v0 by Vercel.
 * @see https://v0.dev/t/1f0aCyD5f2I
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"

export default function Component() {
  const [viewMode, setViewMode] = useState("grid")
  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      <header className="flex items-center justify-between h-16 px-4 border-b shrink-0 md:px-6">
        <Link href="#" className="flex items-center gap-2 text-lg font-semibold sm:text-base" prefetch={false}>
          <LayoutGridIcon className="w-6 h-6" />
          <span>Scrapbook</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button variant={viewMode === "grid" ? "primary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}>
            <LayoutGridIcon className="w-5 h-5" />
          </Button>
          <Button variant={viewMode === "list" ? "primary" : "ghost"} size="icon" onClick={() => setViewMode("list")}>
            <ListIcon className="w-5 h-5" />
          </Button>
          <Button
            variant={viewMode === "calendar" ? "primary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarIcon className="w-5 h-5" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "primary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("kanban")}
          >
            <KanbanIcon className="w-5 h-5" />
          </Button>
        </div>
      </header>
      {viewMode === "grid" && (
        <main className="flex-1 p-4 md:p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card className="relative overflow-hidden group">
            <Link href="#" className="absolute inset-0 z-10" prefetch={false}>
              <span className="sr-only">View project</span>
            </Link>
            <div className="grid grid-cols-2 gap-2 h-[200px] md:h-[250px]">
              <img
                src="/placeholder.svg"
                width={300}
                height={300}
                alt="Project image"
                className="object-cover w-full h-full rounded-tl-lg"
              />
              <div className="grid grid-rows-2 gap-2">
                <img
                  src="/placeholder.svg"
                  width={300}
                  height={300}
                  alt="Project image"
                  className="object-cover w-full h-full rounded-tr-lg"
                />
                <img
                  src="/placeholder.svg"
                  width={300}
                  height={300}
                  alt="Project image"
                  className="object-cover w-full h-full rounded-bl-lg"
                />
              </div>
              <img
                src="/placeholder.svg"
                width={300}
                height={300}
                alt="Project image"
                className="object-cover w-full h-full rounded-br-lg"
              />
            </div>
            <div className="p-4 bg-background">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Project Scrapbook</h3>
                <div className="text-sm text-muted-foreground">Due: June 30, 2023</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-muted-foreground">Progress: 75%</div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <CheckIcon className="w-4 h-4 text-primary" />
                  75%
                </div>
              </div>
            </div>
          </Card>
          <Card className="relative overflow-hidden group">
            <Link href="#" className="absolute inset-0 z-10" prefetch={false}>
              <span className="sr-only">View project</span>
            </Link>
            <div className="grid grid-cols-2 gap-2 h-[200px] md:h-[250px]">
              <img
                src="/placeholder.svg"
                width={300}
                height={300}
                alt="Project image"
                className="object-cover w-full h-full rounded-tl-lg"
              />
              <div className="grid grid-rows-2 gap-2">
                <img
                  src="/placeholder.svg"
                  width={300}
                  height={300}
                  alt="Project image"
                  className="object-cover w-full h-full rounded-tr-lg"
                />
                <img
                  src="/placeholder.svg"
                  width={300}
                  height={300}
                  alt="Project image"
                  className="object-cover w-full h-full rounded-bl-lg"
                />
              </div>
              <img
                src="/placeholder.svg"
                width={300}
                height={300}
                alt="Project image"
                className="object-cover w-full h-full rounded-br-lg"
              />
            </div>
            <div className="p-4 bg-background">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Marketing Campaign</h3>
                <div className="text-sm text-muted-foreground">Due: July 15, 2023</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-muted-foreground">Progress: 50%</div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <CheckIcon className="w-4 h-4 text-primary" />
                  50%
                </div>
              </div>
            </div>
          </Card>
          <Card className="relative overflow-hidden group">
            <Link href="#" className="absolute inset-0 z-10" prefetch={false}>
              <span className="sr-only">View project</span>
            </Link>
            <div className="grid grid-cols-2 gap-2 h-[200px] md:h-[250px]">
              <img
                src="/placeholder.svg"
                width={300}
                height={300}
                alt="Project image"
                className="object-cover w-full h-full rounded-tl-lg"
              />
              <div className="grid grid-rows-2 gap-2">
                <img
                  src="/placeholder.svg"
                  width={300}
                  height={300}
                  alt="Project image"
                  className="object-cover w-full h-full rounded-tr-lg"
                />
                <img
                  src="/placeholder.svg"
                  width={300}
                  height={300}
                  alt="Project image"
                  className="object-cover w-full h-full rounded-bl-lg"
                />
              </div>
              <img
                src="/placeholder.svg"
                width={300}
                height={300}
                alt="Project image"
                className="object-cover w-full h-full rounded-br-lg"
              />
            </div>
            <div className="p-4 bg-background">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Website Redesign</h3>
                <div className="text-sm text-muted-foreground">Due: August 1, 2023</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-muted-foreground">Progress: 25%</div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <CheckIcon className="w-4 h-4 text-primary" />
                  25%
                </div>
              </div>
            </div>
          </Card>
          <Card className="relative overflow-hidden group">
            <Link href="#" className="absolute inset-0 z-10" prefetch={false}>
              <span className="sr-only">View project</span>
            </Link>
            <div className="grid grid-cols-2 gap-2 h-[200px] md:h-[250px]">
              <img
                src="/placeholder.svg"
                width={300}
                height={300}
                alt="Project image"
                className="object-cover w-full h-full rounded-tl-lg"
              />
              <div className="grid grid-rows-2 gap-2">
                <img
                  src="/placeholder.svg"
                  width={300}
                  height={300}
                  alt="Project image"
                  className="object-cover w-full h-full rounded-tr-lg"
                />
                <img
                  src="/placeholder.svg"
                  width={300}
                  height={300}
                  alt="Project image"
                  className="object-cover w-full h-full rounded-bl-lg"
                />
              </div>
              <img
                src="/placeholder.svg"
                width={300}
                height={300}
                alt="Project image"
                className="object-cover w-full h-full rounded-br-lg"
              />
            </div>
            <div className="p-4 bg-background">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Mobile App Development</h3>
                <div className="text-sm text-muted-foreground">Due: September 30, 2023</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-muted-foreground">Progress: 60%</div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <CheckIcon className="w-4 h-4 text-primary" />
                  60%
                </div>
              </div>
            </div>
          </Card>
        </main>
      )}
      {viewMode === "list" && (
        <main className="flex-1 p-4 md:p-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="grid grid-cols-2 gap-2 w-[100px] h-[80px]">
                        <img
                          src="/placeholder.svg"
                          width={100}
                          height={80}
                          alt="Project image"
                          className="object-cover w-full h-full rounded-tl-lg"
                        />
                        <div className="grid grid-rows-2 gap-2">
                          <img
                            src="/placeholder.svg"
                            width={100}
                            height={80}
                            alt="Project image"
                            className="object-cover w-full h-full rounded-tr-lg"
                          />
                          <img
                            src="/placeholder.svg"
                            width={100}
                            height={80}
                            alt="Project image"
                            className="object-cover w-full h-full rounded-bl-lg"
                          />
                        </div>
                        <img
                          src="/placeholder.svg"
                          width={100}
                          height={80}
                          alt="Project image"
                          className="object-cover w-full h-full rounded-br-lg"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Project Scrapbook</h3>
                        <p className="text-sm text-muted-foreground">Scrapbook-style project management</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">June 30, 2023</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <CheckIcon className="w-4 h-4 text-primary" />
                      75%
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="grid grid-cols-2 gap-2 w-[100px] h-[80px]">
                        <img
                          src="/placeholder.svg"
                          width={100}
                          height={80}
                          alt="Project image"
                          className="object-cover w-full h-full rounded-tl-lg"
                        />
                        <div className="grid grid-rows-2 gap-2">
                          <img
                            src="/placeholder.svg"
                            width={100}
                            height={80}
                            alt="Project image"
                            className="object-cover w-full h-full rounded-tr-lg"
                          />
                          <img
                            src="/placeholder.svg"
                            width={100}
                            height={80}
                            alt="Project image"
                            className="object-cover w-full h-full rounded-bl-lg"
                          />
                        </div>
                        <img
                          src="/placeholder.svg"
                          width={100}
                          height={80}
                          alt="Project image"
                          className="object-cover w-full h-full rounded-br-lg"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Marketing Campaign</h3>
                        <p className="text-sm text-muted-foreground">Promotional campaign for new product launch</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">July 15, 2023</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <CheckIcon className="w-4 h-4 text-primary" />
                      50%
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="grid grid-cols-2 gap-2 w-[100px] h-[80px]">
                        <img
                          src="/placeholder.svg"
                          width={100}
                          height={80}
                          alt="Project image"
                          className="object-cover w-full h-full rounded-tl-lg"
                        />
                        <div className="grid grid-rows-2 gap-2">
                          <img
                            src="/placeholder.svg"
                            width={100}
                            height={80}
                            alt="Project image"
                            className="object-cover w-full h-full rounded-tr-lg"
                          />
                          <img src="/placeholder.svg" />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </main>
      )}
    </div>
  )
}

function CalendarIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}


function CheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}


function KanbanIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 5v11" />
      <path d="M12 5v6" />
      <path d="M18 5v14" />
    </svg>
  )
}


function LayoutGridIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}


function ListIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  )
}
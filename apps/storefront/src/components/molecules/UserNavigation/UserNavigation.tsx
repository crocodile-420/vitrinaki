"use client"
import { useTranslator } from "@/lib/i18n/client"
import {
  Badge,
  Card,
  Divider,
  LogoutButton,
  NavigationItem,
} from "@/components/atoms"
import { useUnreads } from "@talkjs/react"
import { usePathname } from "next/navigation"

const navigationItems = [
  {
    label: "Παραγγελίες",
    href: "/user/orders",
  },
  // {
  //   label: "Μηνύματα",
  //   href: "/user/messages",
  // },
  // {
  //   label: "Επιστροφές",
  //   href: "/user/returns",
  // },
  {
    label: "Διευθύνσεις",
    href: "/user/addresses",
  },
  {
    label: "Οι πόντοι μου",
    href: "/user/points",
  },
]

export const UserNavigation = () => {
  const { tr } = useTranslator()
  const unreads = useUnreads()
  const path = usePathname()

  return (
    <Card className="h-min">
      {navigationItems.map((item) => (
        <NavigationItem
          key={item.label}
          href={item.href}
          active={path === item.href}
          className="relative"
        >
          {tr(item.label)}
          {item.href === "/user/messages" && Boolean(unreads?.length) && (
            <Badge className="absolute top-3 left-24 w-4 h-4 p-0">
              {unreads?.length}
            </Badge>
          )}
        </NavigationItem>
      ))}
      <Divider className="my-2" />
      <NavigationItem
        href={"/user/settings"}
        active={path === "/user/settings"}
      >
        {tr("Ρυθμίσεις")}
      </NavigationItem>
      <LogoutButton className="w-full text-left">
        {tr("Αποσύνδεση")}
      </LogoutButton>
    </Card>
  )
}

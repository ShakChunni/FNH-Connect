import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import useFetchClientInformation, {
  ClientWithOrg,
} from "../../../hooks/useFetchClientInformation";
import { Client } from "../../../hooks/useFetchOrganizationInformation";

export interface ClientData {
  id: number | null;
  name: string;
  position: string;
  phone: string;
  email: string;
}

interface UseClientDropdownProps {
  availableClients: Client[];
  onDropdownToggle: (isOpen: boolean) => void;
  onValidationChange: (isValid: { phone: boolean; email: boolean }) => void;
  onDataChange: (data: ClientData) => void;
  value?: ClientData;
}

const useClientDropdown = ({
  availableClients,
  onDropdownToggle,
  onValidationChange,
  onDataChange,
  value,
}: UseClientDropdownProps) => {
  const [localData, setLocalData] = useState<ClientData>(
    value ?? {
      id: null,
      name: "",
      position: "",
      phone: "",
      email: "",
    }
  );

  const [currentOrgClient, setCurrentOrgClient] = useState<Client | null>(null);
  const [originalClientData, setOriginalClientData] =
    useState<ClientData | null>(null);
  const [autofilledFields, setAutofilledFields] = useState<{
    position: boolean;
    phone: boolean;
    email: boolean;
  }>({
    position: false,
    phone: false,
    email: false,
  });

  const [isNewMode, setIsNewMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [clientStatus, setClientStatus] = useState<
    "" | "org-filled" | "global-filled" | "new" | "editing-existing"
  >("");
  const [clientTouched, setClientTouched] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>(value?.name ?? "");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const shouldFetch = searchQuery.length >= 1 && !localData.id;
  const { clients: globalClients, loading } = useFetchClientInformation(
    searchQuery,
    shouldFetch
  );

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      setLocalData(value);
      setSearchQuery(value.name || "");
      setOriginalClientData(value);

      let status:
        | ""
        | "org-filled"
        | "global-filled"
        | "new"
        | "editing-existing" = "";
      if (value.id) {
        const isOrgClient = availableClients?.some(
          (client) => client.id === value.id
        );
        status = isOrgClient ? "org-filled" : "global-filled";

        if (value.id) {
          const clientFromValue: Client = {
            id: value.id,
            name: value.name,
            position: value.position || null,
            contact_number: value.phone || null,
            contact_email: value.email || null,
          };
          setCurrentOrgClient(clientFromValue);
        }
      } else if (value.name) {
        status = "new";
      }

      setAutofilledFields({
        position: !!value.position,
        phone: !!value.phone,
        email: !!value.email,
      });
      setClientStatus(status);
      setClientTouched(false);
      setIsNewMode(false);
      setIsDropdownOpen(false);
    }
  }, [value?.id, availableClients]);

  // Update current org client when availableClients change
  useEffect(() => {
    if (availableClients && availableClients.length > 0 && currentOrgClient) {
      const updatedClient = availableClients.find(
        (client) => client.id === currentOrgClient.id
      );
      if (updatedClient) {
        setCurrentOrgClient(updatedClient);
      }
    }
  }, [availableClients, currentOrgClient?.id]);

  // Notify parent of data changes
  useEffect(() => {
    onDataChange(localData);
  }, [localData, onDataChange]);

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange({ phone: isPhoneValid, email: isEmailValid });
  }, [isPhoneValid, isEmailValid, onValidationChange]);

  const updateDropdownPosition = useCallback(() => {
    if (nameInputRef.current) {
      const rect = nameInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Update dropdown position when dropdown opens or when editing status changes
  useEffect(() => {
    if (isDropdownOpen) {
      // Small delay to ensure DOM updates are complete
      const timeoutId = setTimeout(updateDropdownPosition, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isDropdownOpen, clientStatus, updateDropdownPosition]);

  const isClientSelected = localData.id !== null;
  const isEditingExisting = clientStatus === "editing-existing";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);

    // If we have a selected client and user is changing the name
    if (
      localData.id &&
      originalClientData &&
      newQuery !== originalClientData.name
    ) {
      setLocalData((prev) => ({
        ...prev,
        name: newQuery,
      }));
      setClientStatus("editing-existing");
    }
    // If user changed back to original name
    else if (
      localData.id &&
      originalClientData &&
      newQuery === originalClientData.name
    ) {
      setLocalData((prev) => ({
        ...prev,
        name: newQuery,
      }));
      const isOrgClient = availableClients?.some(
        (client) => client.id === localData.id
      );
      setClientStatus(isOrgClient ? "org-filled" : "global-filled");
    }
    // If no client selected, it's a new search
    else if (!localData.id) {
      setLocalData((prev) => ({
        ...prev,
        id: null,
        name: newQuery,
      }));
      setClientStatus(newQuery.length > 0 ? "new" : "");
    }
    // If we have a client selected but name matches, keep the status
    else {
      setLocalData((prev) => ({
        ...prev,
        name: newQuery,
      }));
    }

    setClientTouched(true);

    // Show dropdown if typing and no client selected, or if we have available clients
    if ((!localData.id && newQuery.length > 0) || availableClients.length > 0) {
      // Update position when opening dropdown
      setTimeout(updateDropdownPosition, 10);
      setIsDropdownOpen(true);
      onDropdownToggle(true);
    } else {
      setIsDropdownOpen(false);
      onDropdownToggle(false);
    }
  };

  const handleInputFocus = () => {
    // Update position when focusing
    setTimeout(updateDropdownPosition, 10);
    setIsDropdownOpen(true);
    onDropdownToggle(true);
  };

  const handleInputBlur = () => {
    if (!searchQuery || !clientTouched) {
      setClientStatus("");
      return;
    }
    if (localData.id) {
      if (originalClientData && searchQuery !== originalClientData.name) {
        setClientStatus("editing-existing");
      } else {
        const isOrgClient = availableClients?.some(
          (client) => client.id === localData.id
        );
        setClientStatus(isOrgClient ? "org-filled" : "global-filled");
      }
    } else if (searchQuery.length > 1) {
      setClientStatus("new");
    } else {
      setClientStatus("");
    }
  };

  const handleSelectOrgClient = useCallback(
    (client: Client) => {
      setTimeout(() => {
        const newData = {
          id: client.id,
          name: client.name,
          position: client.position || "",
          phone: client.contact_number || "",
          email: client.contact_email || "",
        };

        setLocalData(newData);
        setOriginalClientData(newData);

        setAutofilledFields({
          position: !!client.position,
          phone: !!client.contact_number,
          email: !!client.contact_email,
        });

        setSearchQuery(client.name);
        setIsDropdownOpen(false);
        onDropdownToggle(false);
        setClientTouched(true);
        setClientStatus("org-filled");
        setIsNewMode(false);

        setTimeout(() => {
          setIsPhoneValid(
            !client.contact_number ||
              (!!client.contact_number &&
                /^[\d\s()+-]+$/.test(client.contact_number))
          );
          setIsEmailValid(
            !client.contact_email ||
              (!!client.contact_email &&
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.contact_email))
          );
        }, 100);
      }, 0);
    },
    [onDropdownToggle]
  );

  const handleSelectGlobalClient = useCallback(
    (client: ClientWithOrg) => {
      setTimeout(() => {
        const newData = {
          id: client.id,
          name: client.name,
          position: client.position || "",
          phone: client.contact_number || "",
          email: client.contact_email || "",
        };

        setLocalData(newData);
        setOriginalClientData(newData);

        setAutofilledFields({
          position: !!client.position,
          phone: !!client.contact_number,
          email: !!client.contact_email,
        });

        setSearchQuery(client.name);
        setIsDropdownOpen(false);
        onDropdownToggle(false);
        setClientTouched(true);
        setClientStatus("global-filled");
        setIsNewMode(false);

        setTimeout(() => {
          setIsPhoneValid(
            !client.contact_number ||
              (!!client.contact_number &&
                /^[\d\s()+-]+$/.test(client.contact_number))
          );
          setIsEmailValid(
            !client.contact_email ||
              (!!client.contact_email &&
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.contact_email))
          );
        }, 100);
      }, 0);
    },
    [onDropdownToggle]
  );

  const handleAddNew = useCallback(() => {
    setTimeout(() => {
      setIsDropdownOpen(false);
      onDropdownToggle(false);
      setLocalData({
        id: null,
        name: searchQuery,
        position: "",
        phone: "",
        email: "",
      });
      setOriginalClientData(null);

      setAutofilledFields({
        position: false,
        phone: false,
        email: false,
      });
      setClientTouched(true);
      setClientStatus("new");
      setIsNewMode(true);
    }, 0);
  }, [searchQuery, onDropdownToggle]);

  const handleClearSelection = () => {
    setLocalData({
      id: null,
      name: "",
      position: "",
      phone: "",
      email: "",
    });
    setOriginalClientData(null);
    setSearchQuery("");
    setIsNewMode(false);
    setAutofilledFields({
      position: false,
      phone: false,
      email: false,
    });
    setClientStatus("");
    setClientTouched(false);
    setIsDropdownOpen(false);
    onDropdownToggle(false);

    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        // Update position after focus
        setTimeout(updateDropdownPosition, 10);
      }
    }, 0);
  };

  const handleRevertName = () => {
    if (originalClientData) {
      setSearchQuery(originalClientData.name);
      setLocalData((prev) => ({
        ...prev,
        name: originalClientData.name,
      }));
      const isOrgClient = availableClients?.some(
        (client) => client.id === localData.id
      );
      setClientStatus(isOrgClient ? "org-filled" : "global-filled");

      // Update dropdown position after status change
      if (isDropdownOpen) {
        setTimeout(updateDropdownPosition, 50);
      }
    }
  };

  const handleFieldChange = (field: keyof ClientData, value: string) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
    setAutofilledFields((prev) => ({ ...prev, [field]: false }));
  };

  // Handle click outside and scroll events
  const handleScroll = useCallback(
    (event: Event) => {
      if (!isDropdownOpen) return;

      const target = event.target as Element;
      if (
        dropdownRef.current?.contains(target) ||
        nameInputRef.current?.contains(target)
      ) {
        return;
      }

      setIsDropdownOpen(false);
      onDropdownToggle(false);
    },
    [isDropdownOpen, onDropdownToggle]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (dropdownRef.current && dropdownRef.current.contains(target)) ||
        (nameInputRef.current && nameInputRef.current.contains(target))
      ) {
        return;
      }
      setIsDropdownOpen(false);
      onDropdownToggle(false);
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("scroll", handleScroll, { capture: true });
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", updateDropdownPosition);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isDropdownOpen, onDropdownToggle, handleScroll, updateDropdownPosition]);

  const filteredAvailableClients = useMemo(() => {
    const clients = [...availableClients];

    if (currentOrgClient && currentOrgClient.id !== localData.id) {
      const filteredClients = clients.filter(
        (client) => client.id !== currentOrgClient.id
      );
      return [currentOrgClient, ...filteredClients];
    }

    if (
      localData.id &&
      (clientStatus === "org-filled" || clientStatus === "editing-existing")
    ) {
      const currentClient = clients.find(
        (client) => client.id === localData.id
      );
      const otherClients = clients.filter(
        (client) => client.id !== localData.id
      );

      if (currentClient) {
        return [currentClient, ...otherClients];
      }
    }

    return clients;
  }, [availableClients, currentOrgClient, localData.id, clientStatus]);

  const showOrgClients = availableClients && availableClients.length > 0;
  const showGlobalClients =
    !loading &&
    globalClients.length > 0 &&
    searchQuery.length > 0 &&
    !isClientSelected;
  const showAddNew = !loading && searchQuery.length > 1 && !isClientSelected;

  return {
    // State
    localData,
    searchQuery,
    isDropdownOpen,
    clientStatus,
    isClientSelected,
    autofilledFields,
    isPhoneValid,
    isEmailValid,
    originalClientData,
    isEditingExisting,

    // Refs
    nameInputRef,
    dropdownRef,
    dropdownPosition,

    // Computed values
    filteredAvailableClients,
    currentOrgClient,
    showOrgClients,
    showGlobalClients,
    showAddNew,
    loading,
    globalClients,

    // Handlers
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
    handleClearSelection,
    handleFieldChange,
    handleSelectOrgClient,
    handleSelectGlobalClient,
    handleAddNew,
    handleRevertName,
    setIsPhoneValid,
    setIsEmailValid,
  };
};

export default useClientDropdown;

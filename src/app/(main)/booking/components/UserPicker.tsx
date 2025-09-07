"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { SelectedUser } from "../types/sessions";
import MessageDisplay from "../../components/MessageDisplay";
import classes from "./UserPicker.module.css";

interface UserPickerProps {
  selectedUsers: SelectedUser[];
  onUsersChange: (users: SelectedUser[]) => void;
  maxUsers?: number;
  facilitatorId: string;
}

interface SearchResult {
  user_id: string;
  email: string;
  name: string;
  role: string;
  isExternal: false;
}

export default function UserPicker({ 
  selectedUsers, 
  onUsersChange, 
  maxUsers = 50,
  facilitatorId 
}: UserPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExternalForm, setShowExternalForm] = useState(false);
  const [externalUser, setExternalUser] = useState({
    name: "",
    email: "",
    role: "participant" as "participant" | "facilitator",
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const supabase = createClient();

  // Search existing users
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      // Filter out already selected users and the current facilitator
      const filteredResults = data.users.filter((user: SearchResult) => 
        user.user_id !== facilitatorId &&
        !selectedUsers.some(selected => selected.user_id === user.user_id)
      );

      setSearchResults(filteredResults);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectUser = (user: SearchResult) => {
    if (selectedUsers.length >= maxUsers) return;

    const newUser: SelectedUser = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: "participant", // Default role, can be changed later
      isExternal: false,
    };

    onUsersChange([...selectedUsers, newUser]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAddExternalUser = () => {
    if (!externalUser.name.trim() || !externalUser.email.trim()) {
      setError("Name and email are required for external users");
      return;
    }

    if (selectedUsers.length >= maxUsers) return;

    // Check for duplicate emails
    if (selectedUsers.some(user => user.email === externalUser.email.trim())) {
      setError("User with this email is already invited");
      return;
    }

    const newUser: SelectedUser = {
      user_id: null,
      email: externalUser.email.trim(),
      name: externalUser.name.trim(),
      role: externalUser.role,
      isExternal: true,
    };

    onUsersChange([...selectedUsers, newUser]);
    setExternalUser({ name: "", email: "", role: "participant" });
    setShowExternalForm(false);
    setError(null);
  };

  const handleRemoveUser = (email: string) => {
    onUsersChange(selectedUsers.filter(user => user.email !== email));
  };

  const handleChangeUserRole = (email: string, newRole: "participant" | "facilitator") => {
    onUsersChange(
      selectedUsers.map(user => 
        user.email === email ? { ...user, role: newRole } : user
      )
    );
  };

  return (
    <div className={classes.user_picker}>
      <div className={classes.search_section}>
        <h4 className={classes.section_title}>Add Invitees</h4>
        
        <div className={classes.search_input_container}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search existing users by name or email..."
            className={classes.search_input}
          />
          {loading && <div className={classes.loading_indicator}>Searching...</div>}
        </div>

        {searchResults.length > 0 && (
          <div className={classes.search_results}>
            {searchResults.map((user) => (
              <button
                key={user.user_id}
                onClick={() => handleSelectUser(user)}
                className={classes.search_result_item}
                disabled={selectedUsers.length >= maxUsers}
              >
                <div className={classes.user_info}>
                  <div className={classes.user_name}>{user.name}</div>
                  <div className={classes.user_email}>{user.email}</div>
                  <div className={classes.user_role}>({user.role})</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className={classes.external_user_section}>
          <button
            type="button"
            onClick={() => setShowExternalForm(!showExternalForm)}
            className={classes.toggle_external_button}
            disabled={selectedUsers.length >= maxUsers}
          >
            {showExternalForm ? "Cancel" : "Add external user"}
          </button>

          {showExternalForm && (
            <div className={classes.external_form + " stack"}>
              <div className={classes.form_field}>
                <label className={classes.form_label}>Name:</label>
                <input
                  type="text"
                  value={externalUser.name}
                  onChange={(e) => setExternalUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="External user's name"
                  className={classes.form_input}
                />
              </div>
              
              <div className={classes.form_field}>
                <label className={classes.form_label}>Email:</label>
                <input
                  type="email"
                  value={externalUser.email}
                  onChange={(e) => setExternalUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="External user's email"
                  className={classes.form_input}
                />
              </div>
              
              <div className={classes.form_field}>
                <label className={classes.form_label}>Role:</label>
                <select
                  value={externalUser.role}
                  onChange={(e) => setExternalUser(prev => ({ ...prev, role: e.target.value as "participant" | "facilitator" }))}
                  className={classes.form_select}
                >
                  <option value="participant">Participant</option>
                  <option value="facilitator">Facilitator</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddExternalUser}
                className={classes.add_external_button}
              >
                Add External User
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedUsers.length > 0 && (
        <div className={classes.selected_users_section}>
          <h4 className={classes.section_title}>
            Selected Invitees ({selectedUsers.length}/{maxUsers})
          </h4>
          
          <div className={classes.selected_users_list + " stack"}>
            {selectedUsers.map((user) => (
              <div key={user.email} className={classes.selected_user_item}>
                <div className={classes.selected_user_info}>
                  <div className={classes.selected_user_name}>
                    {user.name} {user.isExternal && <span className={classes.external_badge}>(External)</span>}
                  </div>
                  <div className={classes.selected_user_email}>{user.email}</div>
                </div>
                
                <div className={classes.selected_user_controls}>
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeUserRole(user.email, e.target.value as "participant" | "facilitator")}
                    className={classes.role_select}
                  >
                    <option value="participant">Participant</option>
                    <option value="facilitator">Facilitator</option>
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user.email)}
                    className={classes.remove_user_button}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className={classes.error_section}>
          <MessageDisplay message={error} type="error" />
        </div>
      )}
    </div>
  );
}